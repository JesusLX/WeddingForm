import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { GalleryManager } from './GalleryManager'

export default async function GaleriaPage() {
  const { wedding } = await requireWedding<{
    gallery_image_urls: string[] | null
    cover_image_url: string | null
  }>('id, gallery_image_urls, cover_image_url')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
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
