import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import { RecordatoriosManager } from './RecordatoriosManager'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function RecordatoriosPage() {
  const { wedding } = await requireWedding<{
    reminder_enabled: boolean
    reminder_days_before: number
    reminder_last_sent: string | null
  }>('id, reminder_enabled, reminder_days_before, reminder_last_sent')

  const supabase = await createServerSupabaseClient()
  const { count: pendingCount } = await supabase
    .from('expected_guests')
    .select('id', { count: 'exact', head: true })
    .eq('wedding_id', wedding.id)
    .is('rsvp_response_id', null)
    .not('email', 'is', null)

  return (
    <div className="max-w-xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Recordatorios
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.muted }}>
        Envía recordatorios por email a los invitados que aún no han confirmado asistencia.
      </p>
      <RecordatoriosManager
        weddingId={wedding.id}
        initialEnabled={wedding.reminder_enabled ?? false}
        initialDaysBefore={wedding.reminder_days_before ?? 7}
        initialLastSent={wedding.reminder_last_sent ?? null}
        pendingWithEmail={pendingCount ?? 0}
      />
    </div>
  )
}
