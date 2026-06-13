import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'
import { buildPool, generateCard, generateSpanishCard, minPoolFor, SPANISH_CARD_SIZE } from '@/lib/bingo'

const schema = z.object({
  access_key: z.string().uuid(),
  name: z.string().min(1).max(60),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(`bingo-join:${ip}`, { limit: 15, windowMs: 60_000 }).ok) {
      return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 })
    }

    const { access_key, name } = schema.parse(await req.json())
    const supabase = createAdminClient()

    const { data: game } = await supabase
      .from('bingo_games')
      .select('id, enabled, status, cell_type, card_size, number_max, items, drawn, cards_per_player')
      .eq('access_key', access_key)
      .single()

    if (!game || !game.enabled) {
      return NextResponse.json({ error: 'El juego no está disponible' }, { status: 404 })
    }
    if (game.status === 'finished') {
      return NextResponse.json({ error: 'El juego ya ha terminado' }, { status: 400 })
    }

    const numCards: number = game.cards_per_player ?? 1
    let card: (string | null)[]
    if (game.cell_type === 'numbers') {
      // Generate numCards Spanish cards concatenated into one flat array
      card = Array.from({ length: numCards }, () => generateSpanishCard()).flat()
    } else {
      const pool = buildPool(game.cell_type, game.items ?? [], game.number_max)
      if (pool.length < minPoolFor(game.card_size)) {
        return NextResponse.json({ error: 'El juego aún no está configurado' }, { status: 400 })
      }
      card = Array.from({ length: numCards }, () => generateCard(pool, game.card_size)).flat()
    }

    const { data: player, error } = await supabase
      .from('bingo_players')
      .insert({ game_id: game.id, name: name.trim(), card })
      .select('id, name, card, marked')
      .single()

    if (error || !player) {
      return NextResponse.json({ error: 'No se pudo unir al juego' }, { status: 500 })
    }

    return NextResponse.json({
      player_id: player.id,
      name: player.name,
      card: player.card,
      game: {
        id: game.id,
        cell_type: game.cell_type,
        card_size: game.cell_type === 'numbers' ? SPANISH_CARD_SIZE : game.card_size,
        status: game.status,
        drawn: game.drawn ?? [],
      },
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
