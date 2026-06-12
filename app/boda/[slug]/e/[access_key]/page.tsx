export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase-server'
import type React from 'react'
import { EnvelopeReveal } from './EnvelopeReveal'

interface Props {
  params: Promise<{ slug: string; access_key: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, access_key } = await params
  const supabase = await createServerSupabaseClient()
  const { data: wedding } = await supabase
    .from('weddings')
    .select('partner_1, partner_2')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (!wedding) return { title: 'Invitación' }
  // wedding_events has no anon read policy (keys must stay private) — use admin
  const { data: event } = await createAdminClient()
    .from('wedding_events')
    .select('name')
    .eq('access_key', access_key)
    .single()
  return {
    title: event
      ? `${event.name} · ${wedding.partner_1} & ${wedding.partner_2}`
      : 'Invitación',
  }
}

export default async function EventPage({ params }: Props) {
  const { slug, access_key } = await params
  const supabase = await createServerSupabaseClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, partner_1, partner_2, wedding_date, color_bg, color_accent, color_primary, color_dark')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!wedding) notFound()

  // wedding_events has no anon read policy (keys must stay private) — use admin
  const { data: event } = await createAdminClient()
    .from('wedding_events')
    .select('name, event_date, event_time, venue, address, maps_url, description')
    .eq('wedding_id', wedding.id)
    .eq('access_key', access_key)
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
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ ...paletteVars, backgroundColor: 'var(--w-bg)', fontFamily: 'var(--font-playfair)' }}
    >
      <EnvelopeReveal
        event={event}
        weddingNames={`${wedding.partner_1} & ${wedding.partner_2}`}
        weddingYear={new Date(wedding.wedding_date).getFullYear()}
      />
    </main>
  )
}
