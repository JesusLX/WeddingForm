import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PaletteManager } from './PaletteManager'

export default async function PaletaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, color_bg, color_accent, color_primary, color_dark')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1
        className="text-3xl italic mb-2"
        style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
      >
        Paleta de colores
      </h1>
      <p className="text-sm mb-6" style={{ color: '#888' }}>
        Elige un estilo predefinido o personaliza los colores de tu página.
      </p>
      <PaletteManager
        weddingId={wedding?.id ?? ''}
        initialBg={wedding?.color_bg ?? '#FAF7F4'}
        initialAccent={wedding?.color_accent ?? '#F4D7D7'}
        initialPrimary={wedding?.color_primary ?? '#C9A84C'}
        initialDark={wedding?.color_dark ?? '#2D2D2D'}
      />
    </div>
  )
}
