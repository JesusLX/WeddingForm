import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { GuestListManager } from './GuestListManager'

export default async function ListaPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/dashboard/configurar')

  const { data: guests } = await supabase
    .from('expected_guests')
    .select('*, rsvp_response:rsvp_responses(guest_name, attendance)')
    .eq('wedding_id', wedding.id)
    .order('created_at')

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl italic mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Lista de invitados
      </h1>
      <p className="text-sm mb-6" style={{ color: '#555' }}>
        Añade tu lista de invitados para ver quién aún no ha confirmado.
      </p>
      <GuestListManager weddingId={wedding.id} initialGuests={guests ?? []} />
    </div>
  )
}
