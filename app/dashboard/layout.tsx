import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { DashboardNav } from './DashboardNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user has a wedding, if not redirect to setup
  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, slug, partner_1, partner_2')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF7F4' }}>
      <DashboardNav wedding={wedding} userEmail={user.email ?? ''} />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
