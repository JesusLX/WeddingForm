import { requireUser } from '@/lib/dashboard'
import { UI } from '@/lib/ui'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await requireUser()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, partner_1, partner_2')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen" style={{ backgroundColor: UI.bg }}>
      <DashboardNav wedding={wedding} />
      <div className="md:pl-60">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
