import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { GuestTable } from './GuestTable'

export default async function InvitadosPage() {
  const { supabase, wedding } = await requireWedding()

  const [{ data: responses }, { data: menuOptions }] = await Promise.all([
    supabase
      .from('rsvp_responses')
      .select('id, guest_name, attendance, adults_count, adult_names, adult_menus, has_children, children_count, children_names, children_menus, bus_option, allergies, song_request, message, submitted_at')
      .eq('wedding_id', wedding.id)
      .order('submitted_at', { ascending: false }),
    supabase
      .from('menu_options')
      .select('id, name, emoji')
      .eq('wedding_id', wedding.id),
  ])

  return (
    <div>
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Confirmaciones recibidas
      </h1>
      <GuestTable responses={responses ?? []} menuOptions={menuOptions ?? []} />
    </div>
  )
}
