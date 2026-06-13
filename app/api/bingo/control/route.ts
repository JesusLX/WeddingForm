import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { buildPool, shuffle } from '@/lib/bingo'

const schema = z.object({
  action: z.enum(['start', 'draw', 'continue', 'pause', 'end', 'reset']),
})

export async function POST(req: NextRequest) {
  try {
    const { action } = schema.parse(await req.json())
    const supabase = await createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    // RLS (owner_all) guarantees this row belongs to the authenticated couple.
    const { data: game } = await supabase
      .from('bingo_games')
      .select('id, cell_type, card_size, number_max, items, drawn, status, fast_mode, fast_pool, fast_pool_extras')
      .single()

    if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })

    let patch: Record<string, unknown> = {}

    switch (action) {
      case 'start': {
        patch = { status: 'playing' }
        if (game.fast_mode) {
          // Compute pool = all numbers across every player's card + 20 random extras
          const { data: players } = await supabase
            .from('bingo_players')
            .select('card')
            .eq('game_id', game.id)
          const inPlay = new Set<string>()
          for (const p of players ?? []) {
            for (const v of ((p.card as (string | null)[]) ?? [])) {
              if (v !== null) inPlay.add(v)
            }
          }
          const extrasCount = Math.max(0, game.fast_pool_extras ?? 20)
          const allNums = Array.from({ length: 90 }, (_, i) => String(i + 1))
          const extras = shuffle(allNums.filter(n => !inPlay.has(n))).slice(0, extrasCount)
          patch.fast_pool = shuffle([...inPlay, ...extras])
        }
        break
      }
      case 'continue':
        patch = { status: 'playing', pending_claim: null }
        break
      case 'pause':
        patch = { status: 'paused' }
        break
      case 'end':
        patch = { status: 'finished', pending_claim: null }
        break
      case 'reset':
        await supabase.from('bingo_players').delete().eq('game_id', game.id)
        patch = {
          status: 'lobby', drawn: [], pending_claim: null,
          line_awarded: false, bingo_awarded: false, fast_pool: [],
        }
        break
      case 'draw': {
        const fastPool: string[] = game.fast_pool ?? []
        const pool = (game.fast_mode && fastPool.length > 0)
          ? fastPool
          : buildPool(game.cell_type, game.items ?? [], game.number_max)
        const drawn: string[] = game.drawn ?? []
        const remaining = pool.filter(p => !drawn.includes(p))
        if (remaining.length === 0) {
          return NextResponse.json({ error: 'No quedan más por salir', exhausted: true }, { status: 200 })
        }
        const next = remaining[Math.floor(Math.random() * remaining.length)]
        patch = { drawn: [...drawn, next], status: 'playing' }
        break
      }
    }

    const { data: updated, error } = await supabase
      .from('bingo_games')
      .update(patch)
      .eq('id', game.id)
      .select('id, status, drawn, pending_claim, mode, line_awarded, bingo_awarded')
      .single()

    if (error) return NextResponse.json({ error: 'No se pudo actualizar' }, { status: 500 })

    return NextResponse.json({ game: updated })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
