'use client'
import { useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { guestsFromResponses, autoAssignSeats } from '@/lib/seating-algorithm'
import { RelationshipGraph } from './RelationshipGraph'
import { TableView } from './TableView'
import type { GuestRelationship, TableAssignment } from '@/lib/types'

type Tab = 'relaciones' | 'mesas'

interface RsvpRow {
  id: string
  guest_name: string
  attendance: boolean
  adults_count: number
  adult_names: string[] | null
  has_children: boolean
  children_count: number
  children_names: string[] | null
}

interface Props {
  weddingId: string
  responses: RsvpRow[]
  initialRelationships: GuestRelationship[]
  initialAssignments: TableAssignment[]
  initialTablesCount: number
  initialMinGuests: number
  initialMaxGuests: number
}

export function MesasManager({
  weddingId,
  responses,
  initialRelationships,
  initialAssignments,
  initialTablesCount,
  initialMinGuests,
  initialMaxGuests,
}: Props) {
  const [tab, setTab] = useState<Tab>('relaciones')
  const [relationships, setRelationships] = useState<GuestRelationship[]>(initialRelationships)
  const [tablesCount, setTablesCount] = useState(initialTablesCount)
  const [minGuests, setMinGuests] = useState(initialMinGuests)
  const [maxGuests, setMaxGuests] = useState(initialMaxGuests)
  const [assignments, setAssignments] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>()
    initialAssignments.forEach(a => m.set(a.guest_key, a.table_number))
    return m
  })
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [autoWarnings, setAutoWarnings] = useState<string[]>([])
  const [syncing, setSyncing] = useState(false)
  const router = useRouter()

  const guests = useMemo(() => guestsFromResponses(responses), [responses])

  const handleRelationshipsChange = useCallback((rels: GuestRelationship[]) => {
    setRelationships(rels)
  }, [])

  const handleAssignmentsChange = useCallback((a: Map<string, number>) => {
    setAssignments(a)
  }, [])

  function handleAutoAssign() {
    const { assignments: result, warnings } = autoAssignSeats(
      guests,
      relationships,
      tablesCount,
      maxGuests,
    )
    setAssignments(result)
    setAutoWarnings(warnings)
    setTab('mesas')
  }

  async function handleSync() {
    setSyncing(true)
    const supabase = createClient()
    const validIds = responses.map(r => r.id)

    const [{ data: allAssignments }, { data: allRelationships }] = await Promise.all([
      supabase.from('table_assignments').select('id, guest_key').eq('wedding_id', weddingId),
      supabase.from('guest_relationships').select('id, guest_a_key, guest_b_key').eq('wedding_id', weddingId),
    ])

    const staleAssignmentIds = (allAssignments ?? [])
      .filter(a => !validIds.some(id => a.guest_key.startsWith(`${id}_`)))
      .map(a => a.id)

    const staleRelIds = (allRelationships ?? [])
      .filter(r =>
        !validIds.some(id => r.guest_a_key.startsWith(`${id}_`)) ||
        !validIds.some(id => r.guest_b_key.startsWith(`${id}_`))
      )
      .map(r => r.id)

    await Promise.all([
      staleAssignmentIds.length
        ? supabase.from('table_assignments').delete().in('id', staleAssignmentIds)
        : Promise.resolve(),
      staleRelIds.length
        ? supabase.from('guest_relationships').delete().in('id', staleRelIds)
        : Promise.resolve(),
    ])

    setSyncing(false)
    router.refresh()
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg('')
    try {
      const supabase = createClient()

      await Promise.all([
        // Save relationships
        supabase.from('guest_relationships').delete().eq('wedding_id', weddingId).then(() =>
          supabase.from('guest_relationships').insert(
            relationships.map(r => ({
              wedding_id: weddingId,
              guest_a_key: r.guest_a_key,
              guest_b_key: r.guest_b_key,
              type: r.type,
            }))
          )
        ),
        // Save assignments
        (async () => {
          await supabase.from('table_assignments').delete().eq('wedding_id', weddingId)
          const rows = Array.from(assignments.entries()).map(([guestKey, tableNumber]) => ({
            wedding_id: weddingId,
            table_number: tableNumber,
            guest_key: guestKey,
          }))
          if (rows.length) await supabase.from('table_assignments').insert(rows)
        })(),
        // Save table config
        supabase.from('weddings').update({
          tables_count: tablesCount,
          tables_min_guests: minGuests,
          tables_max_guests: maxGuests,
        }).eq('id', weddingId),
      ])

      setSaveMsg('Guardado ✓')
    } catch {
      setSaveMsg('Error al guardar')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  if (guests.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border" style={{ borderColor: '#E5D5C5', color: '#9D8A7A' }}>
        <p className="text-lg mb-1">Sin invitados confirmados</p>
        <p className="text-sm">Cuando los invitados confirmen asistencia aparecerán aquí.</p>
      </div>
    )
  }

  const adultCount = guests.filter(g => !g.isChild).length
  const childCount = guests.filter(g => g.isChild).length

  return (
    <div>
      {/* Stats */}
      <div className="flex flex-wrap gap-3 mb-5">
        {[
          { label: 'Invitados totales', value: guests.length },
          { label: 'Adultos', value: adultCount },
          { label: 'Niños', value: childCount },
          { label: 'Relaciones', value: relationships.length },
          { label: 'Asignados', value: assignments.size },
        ].map(s => (
          <div key={s.label} className="px-3 py-2 rounded-xl text-center"
            style={{ backgroundColor: '#fff', border: '1px solid #E5D5C5', minWidth: 80 }}>
            <div className="text-2xl font-bold" style={{ color: '#C9A84C' }}>{s.value}</div>
            <div className="text-xs" style={{ color: '#9D8A7A' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table config row */}
      <div className="flex flex-wrap items-end gap-4 mb-5 p-4 rounded-xl"
        style={{ backgroundColor: '#fff', border: '1px solid #E5D5C5' }}>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#9D8A7A' }}>Nº de mesas</label>
          <input type="number" min={1} max={50} value={tablesCount}
            onChange={e => setTablesCount(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: '#E5D5C5' }} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#9D8A7A' }}>Mínimo por mesa</label>
          <input type="number" min={1} max={50} value={minGuests}
            onChange={e => setMinGuests(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: '#E5D5C5' }} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: '#9D8A7A' }}>Máximo por mesa</label>
          <input type="number" min={1} max={50} value={maxGuests}
            onChange={e => setMaxGuests(Number(e.target.value))}
            className="w-20 px-2 py-1.5 rounded-lg border text-sm"
            style={{ borderColor: '#E5D5C5' }} />
        </div>
        <button
          onClick={handleAutoAssign}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#2D2D2D', color: '#fff' }}
        >
          ✨ Calcular mesas automáticamente
        </button>
        <button
          onClick={handleSync}
          disabled={syncing}
          title="Elimina invitados cuya confirmación ya fue borrada"
          className="px-4 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#fff', color: '#2D2D2D', border: '1px solid #E5D5C5' }}
        >
          {syncing ? 'Limpiando...' : '🔄 Sincronizar con confirmaciones'}
        </button>
      </div>

      {/* Warnings from auto-assign */}
      {autoWarnings.length > 0 && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{ backgroundColor: '#FFF9E6', border: '1px solid #F0CC66', color: '#7A6000' }}>
          {autoWarnings.map((w, i) => <p key={i}>⚠️ {w}</p>)}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {([['relaciones', '🔗 Relaciones'], ['mesas', '🪑 Mesas']] as [Tab, string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: tab === t ? '#C9A84C' : '#fff',
              color: tab === t ? '#fff' : '#2D2D2D',
              border: '1px solid #E5D5C5',
            }}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'relaciones' && (
        <RelationshipGraph
          guests={guests}
          relationships={relationships}
          weddingId={weddingId}
          onRelationshipsChange={handleRelationshipsChange}
        />
      )}

      {tab === 'mesas' && (
        <TableView
          guests={guests}
          tablesCount={tablesCount}
          assignments={assignments}
          onAssignmentsChange={handleAssignmentsChange}
        />
      )}

      {/* Save */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: '#C9A84C', color: '#fff' }}
        >
          {saving ? 'Guardando...' : 'Guardar todo'}
        </button>
        {saveMsg && (
          <span className="text-sm" style={{ color: saveMsg.startsWith('Error') ? '#F44336' : '#4CAF50' }}>
            {saveMsg}
          </span>
        )}
      </div>
    </div>
  )
}
