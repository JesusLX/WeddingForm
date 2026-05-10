import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { TimelineManager } from './TimelineManager'

export default async function TimelinePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id, event_timeline').eq('user_id', user.id).single()
  if (!wedding) redirect('/dashboard/configurar')

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Programa del día
      </h1>
      <TimelineManager weddingId={wedding.id} initialTimeline={wedding.event_timeline ?? []} />
    </div>
  )
}
