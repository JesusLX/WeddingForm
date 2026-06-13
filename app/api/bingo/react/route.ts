import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase-server'
import { rateLimit } from '@/lib/rate-limit'

type Reaction = { id: string; emoji: string; player_id: string; sent_at: number }

const ALLOWED = new Set(['💕', '🎉', '👏', '🥂', '💃', '🎊', '❤️', '🥳'])
const PLAYER_COOLDOWN_MS = 4000
const REACTION_TTL_MS = 8000

const schema = z.object({
  player_id: z.string().uuid(),
  emoji: z.string().min(1).max(8),
})

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (!rateLimit(`bingo-react:${ip}`, { limit: 15, windowMs: 30_000 }).ok) {
      return NextResponse.json({ error: 'Demasiadas peticiones' }, { status: 429 })
    }

    const { player_id, emoji } = schema.parse(await req.json())

    if (!ALLOWED.has(emoji)) {
      return NextResponse.json({ error: 'Emoji no permitido' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: player } = await supabase
      .from('bingo_players')
      .select('id, game_id')
      .eq('id', player_id)
      .single()

    if (!player) return NextResponse.json({ error: 'Jugador no encontrado' }, { status: 404 })

    const { data: game } = await supabase
      .from('bingo_games')
      .select('id, status, reactions')
      .eq('id', player.game_id)
      .single()

    if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })
    if (game.status !== 'playing' && game.status !== 'paused') {
      return NextResponse.json({ error: 'El juego no está activo' }, { status: 400 })
    }

    const now = Date.now()
    const reactions: Reaction[] = (game.reactions as Reaction[]) ?? []

    // Per-player server-side cooldown
    const lastFromPlayer = [...reactions].reverse().find(r => r.player_id === player_id)
    if (lastFromPlayer && now - lastFromPlayer.sent_at < PLAYER_COOLDOWN_MS) {
      return NextResponse.json({ cooldown: true }, { status: 200 })
    }

    // Discard stale entries and append the new reaction (cap at 50 total)
    const updated: Reaction[] = [
      ...reactions.filter(r => now - r.sent_at < REACTION_TTL_MS),
      { id: crypto.randomUUID(), emoji, player_id, sent_at: now },
    ].slice(-50)

    await supabase
      .from('bingo_games')
      .update({ reactions: updated })
      .eq('id', game.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Datos no válidos' }, { status: 400 })
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
