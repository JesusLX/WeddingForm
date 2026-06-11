export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type React from 'react'
import { createAdminClient } from '@/lib/supabase-server'
import { SecretEventEditor } from './SecretEventEditor'

interface Props {
  params: Promise<{ slug: string; edit_key: string }>
}

export const metadata: Metadata = {
  title: 'Organizar evento secreto',
  robots: { index: false, follow: false },
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function OrganizarPage({ params }: Props) {
  const { slug, edit_key } = await params
  if (!UUID_RE.test(edit_key)) notFound()

  const supabase = createAdminClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, partner_1, partner_2, color_bg, color_accent, color_primary, color_dark')
    .eq('slug', slug)
    .single()

  if (!wedding) notFound()

  const { data: event } = await supabase
    .from('wedding_events')
    .select('name, event_date, event_time, venue, address, maps_url, description, access_key, secret_label')
    .eq('wedding_id', wedding.id)
    .eq('edit_key', edit_key)
    .eq('is_secret', true)
    .single()

  if (!event) notFound()

  const validHex = (c: string | null | undefined, fallback: string) =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : fallback

  const paletteVars = {
    '--w-bg':      validHex(wedding.color_bg,      '#FAF7F4'),
    '--w-accent':  validHex(wedding.color_accent,  '#F4D7D7'),
    '--w-primary': validHex(wedding.color_primary, '#C9A84C'),
    '--w-dark':    validHex(wedding.color_dark,    '#2D2D2D'),
  } as React.CSSProperties

  return (
    <main
      className="min-h-screen py-12 px-4"
      style={{ ...paletteVars, backgroundColor: 'var(--w-bg)' }}
    >
      <SecretEventEditor
        editKey={edit_key}
        weddingSlug={wedding.slug}
        weddingNames={`${wedding.partner_1} & ${wedding.partner_2}`}
        initialEvent={event}
      />
    </main>
  )
}
