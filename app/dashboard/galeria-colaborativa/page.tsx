import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import type { GuestPhoto } from '@/lib/types'
import { GaleriaColabManager } from './GaleriaColabManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function GaleriaColabPage() {
  const { wedding } = await requireWedding<{
    collab_gallery_enabled: boolean
    slug: string
  }>('id, collab_gallery_enabled, slug')

  const supabase = await createServerSupabaseClient()
  const { data: photos } = await supabase
    .from('guest_photos')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Galería colaborativa
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.muted }}>
        Los invitados pueden subir fotos desde su móvil. Tú decides qué fotos se muestran en la página pública.
      </p>
      <GaleriaColabManager
        weddingId={wedding.id}
        slug={wedding.slug}
        initialEnabled={wedding.collab_gallery_enabled ?? false}
        initialPhotos={(photos ?? []) as GuestPhoto[]}
      />
    </div>
  )
}
