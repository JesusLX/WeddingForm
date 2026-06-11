import { requireWedding } from '@/lib/dashboard'
import { UI, pageTitleStyle } from '@/lib/ui'
import { GuestListManager } from './GuestListManager'
import { GuestTabs } from '../invitados/GuestTabs'

export default async function ListaPage() {
  const { supabase, wedding } = await requireWedding()

  const { data: guests } = await supabase
    .from('expected_guests')
    .select('*, rsvp_response:rsvp_responses(guest_name, attendance)')
    .eq('wedding_id', wedding.id)
    .order('created_at')

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl italic mb-6" style={pageTitleStyle}>
        Invitados
      </h1>
      <GuestTabs active="lista" />
      <p className="text-sm mb-4" style={{ color: UI.text }}>
        Añade tu lista de invitados para ver quién aún no ha confirmado.
      </p>
      <GuestListManager weddingId={wedding.id} initialGuests={guests ?? []} />
    </div>
  )
}
