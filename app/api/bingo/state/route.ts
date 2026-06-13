import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-server'

// Public, polled by the guest board (~every 2s) to track drawn items and status.
export async function GET(req: NextRequest) {
  const accessKey = req.nextUrl.searchParams.get('access_key')
  if (!accessKey) {
    return NextResponse.json({ error: 'Falta access_key' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: game } = await supabase
    .from('bingo_games')
    .select('enabled, status, drawn, cell_type, card_size, pending_claim')
    .eq('access_key', accessKey)
    .single()

  if (!game || !game.enabled) {
    return NextResponse.json({ error: 'No disponible' }, { status: 404 })
  }

  return NextResponse.json({
    status: game.status,
    drawn: game.drawn ?? [],
    cell_type: game.cell_type,
    card_size: game.card_size,
    paused_for_claim: !!game.pending_claim,
  })
}
