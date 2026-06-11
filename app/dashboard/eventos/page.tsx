import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import type { WeddingEvent } from '@/lib/types'
import { EventosManager } from './EventosManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function EventosPage() {
  const { wedding } = await requireWedding('id')
  const supabase = await createServerSupabaseClient()

  const { data: events } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('sort_order')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Eventos extra
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.muted }}>
        Añade eventos adicionales como la preboda, la despedida o la comida del día siguiente. Se mostrarán en la página de tu boda.
      </p>
      <EventosManager weddingId={wedding.id} initialEvents={(events ?? []) as WeddingEvent[]} />
    </div>
  )
}
