import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import { MenuManager } from './MenuManager'
import { BusManager } from '../autobus/BusManager'

export default async function MenuPage() {
  const { supabase, wedding } = await requireWedding()

  const [{ data: options }, { data: routes }] = await Promise.all([
    supabase.from('menu_options').select('*').eq('wedding_id', wedding.id).order('sort_order'),
    supabase.from('bus_routes').select('id, wedding_id, direction, label, sort_order').eq('wedding_id', wedding.id).order('sort_order'),
  ])

  return (
    <div className="max-w-xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Menú y autobús
      </h1>

      <div className="space-y-8">
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: UI.primary }}>
            Opciones de menú
          </h2>
          <MenuManager weddingId={wedding.id} initialOptions={options ?? []} />
        </section>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: UI.primary }}>
            Autobús
          </h2>
          <BusManager weddingId={wedding.id} initialRoutes={routes ?? []} />
        </section>
      </div>
    </div>
  )
}
