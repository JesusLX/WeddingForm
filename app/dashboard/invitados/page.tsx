import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { GuestTable } from './GuestTable'

export default async function InvitadosPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!wedding) redirect('/dashboard/configurar')

  const [{ data: responses }, { data: menuOptions }] = await Promise.all([
    supabase
      .from('rsvp_responses')
      .select('id, guest_name, attendance, adults_count, adult_menus, has_children, children_count, children_menus, bus_option, allergies, song_request, message, submitted_at')
      .eq('wedding_id', wedding.id)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('menu_options')
      .select('id, name, emoji')
      .eq('wedding_id', wedding.id),
  ])

  return (
    <div>
      <h1
        className="text-3xl italic mb-6"
        style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
      >
        Confirmaciones recibidas
      </h1>
      <GuestTable responses={responses ?? []} menuOptions={menuOptions ?? []} />
    </div>
  )
}
