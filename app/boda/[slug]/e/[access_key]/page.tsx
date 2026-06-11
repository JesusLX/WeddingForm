export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type React from 'react'

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
  if (!wedding) return { title: 'Evento' }
  const { data: event } = await supabase
    .from('wedding_events')
    .select('name')
    .eq('access_key', access_key)
    .single()
  return { title: event ? `${event.name} · ${wedding.partner_1} & ${wedding.partner_2}` : 'Evento' }
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

  const { data: event } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .eq('access_key', access_key)
    .single()

  if (!event) notFound()

  const validHex = (c: string | null | undefined, fallback: string) =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : fallback

  const paletteVars = {
    '--w-bg': validHex(wedding.color_bg, '#FAF7F4'),
    '--w-accent': validHex(wedding.color_accent, '#F4D7D7'),
    '--w-primary': validHex(wedding.color_primary, '#C9A84C'),
    '--w-dark': validHex(wedding.color_dark, '#2D2D2D'),
  } as React.CSSProperties

  const dateStr = new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = event.event_time ? (event.event_time as string).slice(0, 5) : null

  const mapsHref = event.maps_url
    ? event.maps_url
    : event.address
      ? `https://maps.google.com/?q=${encodeURIComponent(event.address)}`
      : null

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-20"
      style={{ ...paletteVars, backgroundColor: 'var(--w-bg)', fontFamily: 'var(--font-playfair)' }}
    >
      <div className="w-full max-w-lg text-center">
        <p
          className="uppercase tracking-[0.3em] text-xs mb-6"
          style={{ color: 'var(--w-primary)' }}
        >
          {wedding.partner_1} & {wedding.partner_2}
        </p>

        <h1
          className="text-4xl md:text-5xl italic mb-4"
          style={{ color: 'var(--w-dark)' }}
        >
          {event.name}
        </h1>

        <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: 'var(--w-primary)' }} />

        <div className="space-y-2 mb-8">
          <p className="text-lg capitalize" style={{ color: 'var(--w-dark)' }}>
            {dateStr}
          </p>
          {timeStr && (
            <p className="text-2xl font-semibold" style={{ color: 'var(--w-primary)' }}>
              {timeStr}
            </p>
          )}
        </div>

        {(event.venue || event.address) && (
          <div
            className="rounded-2xl px-6 py-5 mb-6 text-left"
            style={{ backgroundColor: 'var(--w-accent)' }}
          >
            {event.venue && (
              <p className="font-semibold text-base mb-1" style={{ color: 'var(--w-dark)' }}>
                {event.venue}
              </p>
            )}
            {event.address && (
              <p className="text-sm" style={{ color: '#666' }}>
                {event.address}
              </p>
            )}
          </div>
        )}

        {event.description && (
          <p className="text-sm leading-relaxed mb-8" style={{ color: '#555' }}>
            {event.description}
          </p>
        )}

        {mapsHref && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'var(--w-primary)', color: '#fff' }}
          >
            Ver en Maps →
          </a>
        )}
      </div>

      <footer className="mt-20 text-xs" style={{ color: 'var(--w-primary)', opacity: 0.5 }}>
        {wedding.partner_1} & {wedding.partner_2} · {new Date(wedding.wedding_date).getFullYear()}
      </footer>
    </main>
  )
}
