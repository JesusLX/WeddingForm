export const dynamic = 'force-dynamic'

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type React from 'react'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { GuestPhoto, Wedding } from '@/lib/types'
import { GuestPhotoUpload } from './GuestPhotoUpload'

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
  if (!data) return { title: 'Fotos' }
  return { title: `Fotos · ${data.partner_1} & ${data.partner_2}` }
}

export default async function FotosPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, partner_1, partner_2, wedding_date, collab_gallery_enabled, color_bg, color_accent, color_primary, color_dark')
    .eq('slug', slug)
    .eq('is_published', true)
    .single<Pick<Wedding, 'id' | 'partner_1' | 'partner_2' | 'wedding_date' | 'collab_gallery_enabled' | 'color_bg' | 'color_accent' | 'color_primary' | 'color_dark'>>()

  if (!wedding || !wedding.collab_gallery_enabled) notFound()

  const { data: approvedPhotos } = await supabase
    .from('guest_photos')
    .select('*')
    .eq('wedding_id', wedding.id)
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(50)

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
      <div className="max-w-xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <p
            className="uppercase tracking-[0.3em] text-xs mb-3"
            style={{ color: 'var(--w-primary)' }}
          >
            {wedding.partner_1} &amp; {wedding.partner_2}
          </p>
          <h1
            className="text-3xl italic"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
          >
            Comparte tu foto
          </h1>
          <p className="text-sm mt-3" style={{ color: '#666' }}>
            Sube una foto del día y ayúdanos a recordar este momento especial.
          </p>
        </div>

        <GuestPhotoUpload weddingId={wedding.id} />

        {/* Approved gallery */}
        {(approvedPhotos ?? []).length > 0 && (
          <div className="mt-12">
            <h2
              className="text-xl italic text-center mb-6"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              Fotos de los invitados
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {(approvedPhotos as GuestPhoto[]).map(photo => (
                <div
                  key={photo.id}
                  className="rounded-xl overflow-hidden"
                  style={{ aspectRatio: '1', backgroundColor: 'var(--w-accent)' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.photo_url}
                    alt={photo.caption ?? ''}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
