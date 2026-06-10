import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { BusManager } from './BusManager'

export default async function AutobusPage() {
  const { supabase, wedding } = await requireWedding()

  const { data: routes } = await supabase
    .from('bus_routes')
    .select('id, wedding_id, direction, label, sort_order')
    .eq('wedding_id', wedding.id)
    .order('sort_order')

  return (
    <div>
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Autobús
      </h1>
      <BusManager weddingId={wedding.id} initialRoutes={routes ?? []} />
    </div>
  )
}
