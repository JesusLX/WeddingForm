export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type React from 'react'
import type { Wedding, MenuOption, BusRoute, WeddingEvent, GuestPhoto } from '@/lib/types'
import { demoWedding, demoMenuOptions, demoBusRoutes } from '@/lib/demo-wedding'
import { HeroSection } from './components/HeroSection'
import { OurStorySection } from './components/OurStorySection'
import { EventDetailsSection } from './components/EventDetailsSection'
import { ExtraEventsSection } from './components/ExtraEventsSection'
import { TimelineSection } from './components/TimelineSection'
import { GallerySection } from './components/GallerySection'
import { CollabGallerySection } from './components/CollabGallerySection'
import { DressCodeSection } from './components/DressCodeSection'
import { RSVPSection } from './components/RSVPSection'
import { BankInfoSection } from './components/BankInfoSection'
import { SpotifySection } from './components/SpotifySection'
import { FAQSection } from './components/FAQSection'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const wedding = slug === 'demo'
    ? demoWedding
    : (await (await createServerSupabaseClient())
        .from('weddings')
        .select('partner_1, partner_2, wedding_date, ceremony_venue, ceremony_address, cover_image_url')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()).data

  if (!wedding) return { title: 'Boda' }

  const title = `${wedding.partner_1} & ${wedding.partner_2} se casan 💍`
  const dateStr = new Date(wedding.wedding_date).toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const location = wedding.ceremony_venue ?? wedding.ceremony_address ?? null
  const description = location
    ? `${dateStr} · ${location}. Confirma tu asistencia y no te pierdas este día tan especial.`
    : `${dateStr}. Confirma tu asistencia y no te pierdas este día tan especial.`

  const imageUrl = wedding.cover_image_url ?? null
  const images = imageUrl
    ? [{ url: imageUrl, width: 1200, height: 630, alt: title }]
    : []

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      locale: 'es_ES',
      siteName: 'Mi Boda',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export default async function WeddingPage({ params }: Props) {
  const { slug } = await params

  let wedding: Wedding
  let menuOptions: MenuOption[]
  let busRoutes: BusRoute[]
  let extraEvents: WeddingEvent[] = []
  let collabPhotos: GuestPhoto[] = []

  if (slug === 'demo') {
    wedding = demoWedding
    menuOptions = demoMenuOptions
    busRoutes = demoBusRoutes
  } else {
    const supabase = await createServerSupabaseClient()
    const { data } = await supabase
      .from('weddings')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single<Wedding>()

    if (!data) notFound()
    wedding = data

    const [{ data: menus }, { data: buses }, { data: events }, { data: photos }] = await Promise.all([
      supabase.from('menu_options').select('*').eq('wedding_id', wedding.id).order('sort_order'),
      supabase.from('bus_routes').select('id, direction, label, sort_order').eq('wedding_id', wedding.id).order('sort_order'),
      supabase.from('wedding_events').select('*').eq('wedding_id', wedding.id).order('sort_order'),
      wedding.collab_gallery_enabled
        ? supabase.from('guest_photos').select('*').eq('wedding_id', wedding.id).eq('approved', true).order('created_at', { ascending: false }).limit(30)
        : Promise.resolve({ data: [] }),
    ])
    menuOptions = menus ?? []
    busRoutes = (buses ?? []) as BusRoute[]
    extraEvents = (events ?? []) as WeddingEvent[]
    collabPhotos = (photos ?? []) as GuestPhoto[]
  }

  const footer = (
    <footer className="py-8 text-center text-sm" style={{ color: '#C9A84C', backgroundColor: '#2D2D2D' }}>
      <p style={{ fontFamily: 'var(--font-playfair)' }}>
        {wedding.partner_1} & {wedding.partner_2} · {new Date(wedding.wedding_date).getFullYear()}
      </p>
    </footer>
  )

  const validHex = (c: string | null | undefined, fallback: string) =>
    c && /^#[0-9A-Fa-f]{6}$/.test(c) ? c : fallback

  const paletteVars = {
    '--w-bg': validHex(wedding.color_bg, '#FAF7F4'),
    '--w-accent': validHex(wedding.color_accent, '#F4D7D7'),
    '--w-primary': validHex(wedding.color_primary, '#C9A84C'),
    '--w-dark': validHex(wedding.color_dark, '#2D2D2D'),
  } as React.CSSProperties

  return (
    <main style={paletteVars}>
      <HeroSection wedding={wedding} />
      <OurStorySection wedding={wedding} />
      <EventDetailsSection wedding={wedding} />
      <ExtraEventsSection events={extraEvents} />
      <TimelineSection wedding={wedding} />
      <GallerySection wedding={wedding} />
      <CollabGallerySection photos={collabPhotos} slug={slug} />
      <DressCodeSection wedding={wedding} />
      <SpotifySection wedding={wedding} />
      <RSVPSection wedding={wedding} menuOptions={menuOptions} busRoutes={busRoutes} />
      <BankInfoSection wedding={wedding} />
      <FAQSection wedding={wedding} />
      {footer}
    </main>
  )
}
