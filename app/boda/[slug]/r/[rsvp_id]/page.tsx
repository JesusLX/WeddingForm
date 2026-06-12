export const dynamic = 'force-dynamic'
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type React from 'react'
import type { Wedding, MenuOption, BusRoute } from '@/lib/types'
import { RSVPForm } from '../../components/RSVPForm'

interface Props {
  params: Promise<{ slug: string; rsvp_id: string }>
}

export default async function RsvpEditPage({ params }: Props) {
  const { slug, rsvp_id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single<Wedding>()

  if (!wedding) notFound()

  const { data: rsvp } = await supabase
    .from('rsvp_responses')
    .select('id, guest_name, attendance, adults_count, adult_names, adult_menus, has_children, children_count, children_names, children_menus, bus_outbound, bus_return, allergies, song_request, message')
    .eq('id', rsvp_id)
    .eq('wedding_id', wedding.id)
    .single()

  if (!rsvp) notFound()

  const [{ data: menus }, { data: buses }] = await Promise.all([
    supabase.from('menu_options').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('bus_routes').select('id, direction, label, sort_order').eq('wedding_id', wedding.id).order('sort_order'),
  ])

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
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest mb-2" style={{ color: 'var(--w-primary)' }}>
            {wedding.partner_1} & {wedding.partner_2}
          </p>
          <h1 className="text-2xl italic" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
            Modifica tu confirmación
          </h1>
        </div>
        <RSVPForm
          wedding={wedding}
          menuOptions={(menus ?? []) as MenuOption[]}
          busRoutes={(buses ?? []) as BusRoute[]}
          initialData={rsvp}
        />
      </div>
    </main>
  )
}
