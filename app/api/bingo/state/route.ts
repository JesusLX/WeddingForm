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

  // If the guest passes their player_id, verify they still exist in the DB.
  // After a reset the row is deleted, so player_exists=false triggers a re-join.
  let player_exists = true
  if (playerId) {
    const { data: player } = await supabase
      .from('bingo_players')
      .select('id')
      .eq('id', playerId)
      .eq('game_id', game.id)
      .single()
    player_exists = !!player
  }

  return NextResponse.json({
    status: game.status,
    drawn: game.drawn ?? [],
    cell_type: game.cell_type,
    card_size: game.card_size,
    paused_for_claim: !!game.pending_claim,
    player_exists,
  })
}
