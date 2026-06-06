import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { MesasManager } from './MesasManager'
import type { GuestRelationship, TableAssignment } from '@/lib/types'

export default async function MesasPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, tables_count, tables_min_guests, tables_max_guests')
    .eq('user_id', user.id)
    .single()
  if (!wedding) redirect('/dashboard/configurar')

  const [{ data: responses }, { data: relationships }, { data: assignments }] = await Promise.all([
    supabase
      .from('rsvp_responses')
      .select('id, guest_name, attendance, adults_count, adult_names, has_children, children_count, children_names')
      .eq('wedding_id', wedding.id)
      .eq('attendance', true),
    supabase
      .from('guest_relationships')
      .select('*')
      .eq('wedding_id', wedding.id),
    supabase
      .from('table_assignments')
      .select('*')
      .eq('wedding_id', wedding.id),
  ])

  return (
    <div>
      <h1 className="text-3xl italic mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Distribución de mesas
      </h1>
      <p className="text-sm mb-6" style={{ color: '#9D8A7A' }}>
        Define relaciones entre invitados y calcula la distribución óptima de mesas.
      </p>
      <MesasManager
        weddingId={wedding.id}
        responses={responses ?? []}
        initialRelationships={(relationships as GuestRelationship[]) ?? []}
        initialAssignments={(assignments as TableAssignment[]) ?? []}
        initialTablesCount={wedding.tables_count ?? 10}
        initialMinGuests={wedding.tables_min_guests ?? 8}
        initialMaxGuests={wedding.tables_max_guests ?? 10}
      />
    </div>
  )
}
