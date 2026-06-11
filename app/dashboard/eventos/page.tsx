import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import type { WeddingEvent } from '@/lib/types'
import { EventosManager } from './EventosManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function EventosPage() {
  const { wedding } = await requireWedding<{ slug: string }>('id, slug')
  const supabase = await createServerSupabaseClient()

  const { data: events } = await supabase
    .from('wedding_events')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('sort_order')

  // Secret events: strip details server-side so spoilers never reach the
  // couple's browser — they only see their own label and the links.
  const safeEvents = (events ?? []).map(ev =>
    ev.is_secret
      ? {
          ...ev,
          name: 'Evento secreto',
          event_date: null, event_time: null,
          venue: null, address: null, maps_url: null, description: null,
        }
      : ev
  )

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Eventos extra
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.muted }}>
        Añade eventos privados como la preboda, la despedida o la comida del día siguiente. Cada uno tiene un enlace único que compartes solo con sus invitados.
      </p>
      <EventosManager weddingId={wedding.id} weddingSlug={wedding.slug} initialEvents={safeEvents as WeddingEvent[]} />
    </div>
  )
}
