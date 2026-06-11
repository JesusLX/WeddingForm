import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { MenuManager } from './MenuManager'

export default async function MenuPage() {
  const { supabase, wedding } = await requireWedding()

  const { data: options } = await supabase
    .from('menu_options').select('*').eq('wedding_id', wedding.id).order('sort_order')

  return (
    <div className="max-w-xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Menú
      </h1>
      <MenuManager weddingId={wedding.id} initialOptions={options ?? []} />
    </div>
  )
}
