import { requireWedding } from '@/lib/dashboard'
import { UI, pageTitleStyle } from '@/lib/ui'
import { PaletteManager } from './PaletteManager'

export default async function PaletaPage() {
  const { wedding } = await requireWedding<{
    color_bg: string | null
    color_accent: string | null
    color_primary: string | null
    color_dark: string | null
  }>('id, color_bg, color_accent, color_primary, color_dark')

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl italic mb-2" style={pageTitleStyle}>
        Paleta de colores
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.muted }}>
        Elige un estilo predefinido o personaliza los colores de tu página.
      </p>
      <PaletteManager
        weddingId={wedding.id}
        initialBg={wedding.color_bg ?? '#FAF7F4'}
        initialAccent={wedding.color_accent ?? '#F4D7D7'}
        initialPrimary={wedding.color_primary ?? '#C9A84C'}
        initialDark={wedding.color_dark ?? '#2D2D2D'}
      />
    </div>
  )
}
