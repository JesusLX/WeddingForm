export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { TimelineSection } from '../components/TimelineSection'
import type { Wedding } from '@/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase
    .from('weddings')
    .select('partner_1, partner_2')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()
  if (!data) return { title: 'Programa' }
  return { title: `Programa del día · ${data.partner_1} & ${data.partner_2}` }
}

export default async function ProgramaPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data } = await supabase
    .from('weddings')
    .select('id, partner_1, partner_2, wedding_date, event_timeline, program_enabled, color_bg, color_accent, color_primary, color_dark')
    .eq('slug', slug)
    .eq('is_published', true)
    .single<Pick<Wedding, 'id' | 'partner_1' | 'partner_2' | 'wedding_date' | 'event_timeline' | 'program_enabled' | 'color_bg' | 'color_accent' | 'color_primary' | 'color_dark'>>()

  if (!data || !data.program_enabled) notFound()

  const validHex = (c: string | null | undefined, fallback: string) =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : fallback

  const paletteVars = {
    '--w-bg': validHex(data.color_bg, '#FAF7F4'),
    '--w-accent': validHex(data.color_accent, '#F4D7D7'),
    '--w-primary': validHex(data.color_primary, '#C9A84C'),
    '--w-dark': validHex(data.color_dark, '#2D2D2D'),
  } as React.CSSProperties

  const dateStr = new Date(data.wedding_date).toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main style={{ ...paletteVars, minHeight: '100vh', backgroundColor: 'var(--w-bg)' }}>
      <header className="pt-12 pb-4 text-center px-6">
        <p
          className="text-sm uppercase tracking-[0.3em] mb-2"
          style={{ color: 'var(--w-primary)' }}
        >
          {dateStr}
        </p>
        <h1
          className="text-4xl md:text-5xl italic"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
        >
          {data.partner_1} &amp; {data.partner_2}
        </h1>
      </header>

      <TimelineSection wedding={data as unknown as Wedding} />

      <footer className="py-8 text-center text-xs" style={{ color: 'var(--w-primary)' }}>
        {data.partner_1} &amp; {data.partner_2} · {new Date(data.wedding_date).getFullYear()}
      </footer>
    </main>
  )
}
