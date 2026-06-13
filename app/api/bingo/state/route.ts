import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Public, polled by the guest board (~every 2.5s) to track drawn items and status.
export async function GET(req: NextRequest) {
  const accessKey = req.nextUrl.searchParams.get('access_key')
  const playerId  = req.nextUrl.searchParams.get('player_id')

  if (!accessKey) {
    return NextResponse.json({ error: 'Falta access_key' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: game } = await supabase
    .from('bingo_games')
    .select('id, enabled, status, drawn, cell_type, card_size, pending_claim')
    .eq('access_key', accessKey)
    .single()

  if (!game || !game.enabled) {
    return NextResponse.json({ error: 'No disponible' }, { status: 404 })
  }

  // If the guest passes their player_id, return their current card so the
  // client can detect card regeneration (reset with names preserved).
  let player_exists = true
  let player_card: (string | null)[] | null = null
  if (playerId) {
    const { data: player } = await supabase
      .from('bingo_players')
      .select('id, card')
      .eq('id', playerId)
      .eq('game_id', game.id)
      .single()
    player_exists = !!player
    if (player) player_card = player.card as (string | null)[]
  }

  return NextResponse.json({
    status: game.status,
    drawn: game.drawn ?? [],
    cell_type: game.cell_type,
    card_size: game.card_size,
    paused_for_claim: !!game.pending_claim,
    player_exists,
    player_card,
  })
}
