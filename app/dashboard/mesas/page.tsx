import { requireWedding } from '@/lib/dashboard'
import { UI, pageTitleStyle } from '@/lib/ui'
import { MesasManager } from './MesasManager'
import type { GuestRelationship, TableAssignment } from '@/lib/types'

export default async function MesasPage() {
  const { supabase, wedding } = await requireWedding<{
    tables_count: number | null
    tables_min_guests: number | null
    tables_max_guests: number | null
  }>('id, tables_count, tables_min_guests, tables_max_guests')

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
      <h1 className="text-3xl italic mb-2" style={pageTitleStyle}>
        Distribución de mesas
      </h1>
      <p className="text-sm mb-6" style={{ color: UI.text }}>
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
