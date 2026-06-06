import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GalleryManager } from './GalleryManager'

export default async function GaleriaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id, gallery_image_urls, cover_image_url').eq('user_id', user.id).single()
  if (!wedding) redirect('/dashboard/configurar')

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Galería de fotos
      </h1>
      <GalleryManager
        weddingId={wedding.id}
        initialImages={wedding.gallery_image_urls ?? []}
        initialCover={wedding.cover_image_url ?? ''}
      />
    </div>
  )
}
