import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import { GalleryManager } from '../galeria/GalleryManager'
import { PaletteManager } from '../paleta/PaletteManager'

export default async function AparienciaPage() {
  const { wedding } = await requireWedding<{
    gallery_image_urls: string[] | null
    cover_image_url: string | null
    color_bg: string | null
    color_accent: string | null
    color_primary: string | null
    color_dark: string | null
  }>('id, gallery_image_urls, cover_image_url, color_bg, color_accent, color_primary, color_dark')

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Apariencia
      </h1>

      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: UI.dark }}>Fotos</h2>
        <p className="text-sm mb-4" style={{ color: UI.muted }}>
          Portada y galería que aparecen en tu página pública.
        </p>
        <GalleryManager
          weddingId={wedding.id}
          initialImages={wedding.gallery_image_urls ?? []}
          initialCover={wedding.cover_image_url ?? ''}
        />
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: UI.dark }}>Paleta de colores</h2>
        <p className="text-sm mb-4" style={{ color: UI.muted }}>
          Elige un estilo predefinido o personaliza los colores.
        </p>
        <PaletteManager
          weddingId={wedding.id}
          initialBg={wedding.color_bg ?? '#FAF7F4'}
          initialAccent={wedding.color_accent ?? '#F4D7D7'}
          initialPrimary={wedding.color_primary ?? '#C9A84C'}
          initialDark={wedding.color_dark ?? '#2D2D2D'}
        />
      </section>
    </div>
  )
}
