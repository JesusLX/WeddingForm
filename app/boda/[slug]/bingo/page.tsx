export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type React from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import { BingoHub } from './BingoHub'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BingoPublicPage({ params }: Props) {
  const { slug } = await params
  const admin = createAdminClient()

  const { data: wedding } = await admin
    .from('weddings')
    .select('id, partner_1, partner_2, is_published, color_bg, color_accent, color_primary, color_dark')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!wedding) notFound()

  const { data: game } = await admin
    .from('bingo_games')
    .select('access_key, enabled, cell_type, card_size, status')
    .eq('wedding_id', wedding.id)
    .single()

  if (!game || !game.enabled) notFound()

  const validHex = (c: string | null | undefined, fallback: string) =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : fallback

  const paletteVars = {
    '--w-bg': validHex(wedding.color_bg, '#FAF7F4'),
    '--w-accent': validHex(wedding.color_accent, '#F4D7D7'),
    '--w-primary': validHex(wedding.color_primary, '#C9A84C'),
    '--w-dark': validHex(wedding.color_dark, '#2D2D2D'),
  } as React.CSSProperties

  return (
    <main style={{ ...paletteVars, minHeight: '100vh', backgroundColor: 'var(--w-bg)' }}>
      <BingoHub
        accessKey={game.access_key}
        cellType={game.cell_type}
        cardSize={game.card_size}
        weddingNames={`${wedding.partner_1} & ${wedding.partner_2}`}
      />
    </main>
  )
}
