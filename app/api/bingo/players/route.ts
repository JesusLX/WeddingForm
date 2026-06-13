import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// Auth — master view polls this (~every 2s) for the live player list + game state.
export async function GET() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { data: game } = await supabase
    .from('bingo_games')
    .select('id, status, drawn, mode, pending_claim, line_awarded, bingo_awarded, card_size, cell_type')
    .single()

  if (!game) return NextResponse.json({ error: 'Juego no encontrado' }, { status: 404 })

  const { data: players } = await supabase
    .from('bingo_players')
    .select('id, name, has_line, has_bingo, marked, joined_at')
    .eq('game_id', game.id)
    .order('joined_at')

  return NextResponse.json({
    game,
    players: (players ?? []).map(p => ({
      id: p.id,
      name: p.name,
      has_line: p.has_line,
      has_bingo: p.has_bingo,
      marked_count: (p.marked ?? []).length,
    })),
  })
}
