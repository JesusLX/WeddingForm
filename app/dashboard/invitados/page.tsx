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

  const { data: responses } = await supabase
    .from('rsvp_responses')
    .select('*, menu_option:menu_options(name, emoji)')
    .eq('wedding_id', wedding.id)
    .order('submitted_at', { ascending: false })

  return (
    <div>
      <h1
        className="text-3xl italic mb-6"
        style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
      >
        Confirmaciones recibidas
      </h1>
      <GuestTable responses={responses ?? []} />
    </div>
  )
}
