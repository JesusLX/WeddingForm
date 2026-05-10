import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'
import type { Wedding, MenuOption } from '@/lib/types'
import { HeroSection } from './components/HeroSection'
import { OurStorySection } from './components/OurStorySection'
import { EventDetailsSection } from './components/EventDetailsSection'
import { TimelineSection } from './components/TimelineSection'
import { GallerySection } from './components/GallerySection'
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
  const supabase = await createServerSupabaseClient()
  const { data: wedding } = await supabase
    .from('weddings')
    .select('partner_1, partner_2, wedding_date, cover_image_url')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (!wedding) return { title: 'Boda' }

  return {
    title: `Boda de ${wedding.partner_1} & ${wedding.partner_2}`,
    description: `Únete a la celebración de ${wedding.partner_1} y ${wedding.partner_2}`,
    openGraph: {
      images: wedding.cover_image_url ? [wedding.cover_image_url] : [],
    },
  }
}

export default async function WeddingPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single<Wedding>()

  if (!wedding) notFound()

  const { data: menuOptions } = await supabase
    .from('menu_options')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('sort_order')

  const footer = (
    <footer className="py-8 text-center text-sm" style={{ color: '#C9A84C', backgroundColor: '#2D2D2D' }}>
      <p style={{ fontFamily: 'var(--font-playfair)' }}>
        {wedding.partner_1} & {wedding.partner_2} · {new Date(wedding.wedding_date).getFullYear()}
      </p>
    </footer>
  )

  return (
    <main>
      <HeroSection wedding={wedding} />
      <OurStorySection wedding={wedding} />
      <EventDetailsSection wedding={wedding} />
      <TimelineSection wedding={wedding} />
      <GallerySection wedding={wedding} />
      <DressCodeSection wedding={wedding} />
      <SpotifySection wedding={wedding} />
      <RSVPSection wedding={wedding} menuOptions={menuOptions ?? []} />
      <BankInfoSection wedding={wedding} />
      <FAQSection wedding={wedding} />
      {footer}
    </main>
  )
}
