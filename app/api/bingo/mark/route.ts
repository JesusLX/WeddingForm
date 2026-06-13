import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { hasLine, hasBingo } from '@/lib/bingo'

const schema = z.object({
  player_id: z.string().uuid(),
  index: z.number().int().min(0).max(24),
})

export async function POST(req: NextRequest) {
  try {
    const { player_id, index } = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: player } = await supabase
      .from('bingo_players')
      .select('id, name, game_id, card, marked, has_line, has_bingo')
      .eq('id', player_id)
      .single()

    if (!player) {
      return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })
    }

    const { data: game } = await supabase
      .from('bingo_games')
      .select('id, status, drawn, card_size, line_prize_enabled, bingo_prize_enabled, line_awarded, bingo_awarded')
      .eq('id', player.game_id)
      .single()

    if (!game) {
      return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })
    }
    if (game.status !== 'playing') {
      return NextResponse.json({ error: 'El juego no está en marcha', status: game.status }, { status: 409 })
    }

    const card: string[] = player.card ?? []
    if (index >= card.length) {
      return NextResponse.json({ error: 'Casilla no válida' }, { status: 400 })
    }

    const drawn = new Set<string>(game.drawn ?? [])
    const value = card[index]
    const marked: number[] = player.marked ?? []
    const wasMarked = marked.includes(index)

    // A cell can only be marked if its value has actually been drawn.
    if (!wasMarked && !drawn.has(value)) {
      return NextResponse.json({ error: 'Ese valor aún no ha salido', rejected: true }, { status: 200 })
    }

    const newMarked = wasMarked
      ? marked.filter(i => i !== index)
      : [...marked, index]

    const nowLine = hasLine(newMarked, game.card_size)
    const nowBingo = hasBingo(newMarked, game.card_size)

    await supabase
      .from('bingo_players')
      .update({ marked: newMarked, has_line: nowLine, has_bingo: nowBingo })
      .eq('id', player.id)

    // Detect a new prized claim. Bingo takes priority over line.
    let claim: 'line' | 'bingo' | null = null
    if (nowBingo && game.bingo_prize_enabled && !game.bingo_awarded) {
      claim = 'bingo'
    } else if (nowLine && !player.has_line && game.line_prize_enabled && !game.line_awarded) {
      claim = 'line'
    }

    if (claim) {
      await supabase
        .from('bingo_games')
        .update({
          status: 'paused',
          pending_claim: { player_id: player.id, name: player.name, type: claim },
          ...(claim === 'line' ? { line_awarded: true } : { bingo_awarded: true }),
        })
        .eq('id', game.id)
    }

    return NextResponse.json({
      marked: newMarked,
      has_line: nowLine,
      has_bingo: nowBingo,
      claim,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
