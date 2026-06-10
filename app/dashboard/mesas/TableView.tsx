'use client'
import { useState } from 'react'
import type { SeatingGuest } from '@/lib/types'

interface Props {
  guests: SeatingGuest[]
  tablesCount: number
  assignments: Map<string, number>
  onAssignmentsChange: (a: Map<string, number>) => void
}

export function TableView({ guests, tablesCount, assignments, onAssignmentsChange }: Props) {
  const [dragging, setDragging] = useState<string | null>(null)

  // Build table -> guests map
  const tables: Map<number, SeatingGuest[]> = new Map()
  for (let i = 1; i <= tablesCount; i++) tables.set(i, [])
  const unassigned: SeatingGuest[] = []

  for (const guest of guests) {
    const t = assignments.get(guest.key)
    if (t && tables.has(t)) {
      tables.get(t)!.push(guest)
    } else {
      unassigned.push(guest)
    }
  }

  function moveGuest(guestKey: string, toTable: number | null) {
    const next = new Map(assignments)
    if (toTable === null) {
      next.delete(guestKey)
    } else {
      next.set(guestKey, toTable)
    }
    onAssignmentsChange(next)
  }

  function handleDrop(e: React.DragEvent, toTable: number | null) {
    e.preventDefault()
    const key = e.dataTransfer.getData('guestKey')
    if (key) moveGuest(key, toTable)
    setDragging(null)
  }

  function GuestChip({ guest }: { guest: SeatingGuest }) {
    return (
      <div
        draggable
        onDragStart={e => { e.dataTransfer.setData('guestKey', guest.key); setDragging(guest.key) }}
        onDragEnd={() => setDragging(null)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs cursor-grab active:cursor-grabbing select-none"
        style={{
          backgroundColor: guest.isChild ? '#F4D7D7' : '#C9A84C22',
          color: '#2D2D2D',
          border: `1px solid ${guest.isChild ? '#e0a0a0' : '#C9A84C66'}`,
          opacity: dragging === guest.key ? 0.4 : 1,
        }}
        title={`${guest.name} — arrastra para mover`}
      >
        {guest.isChild && <span>👶</span>}
        {guest.name}
      </div>
    )
  }

  return (
    <div>
      {unassigned.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border-2 border-dashed"
          style={{ borderColor: '#F44336', backgroundColor: '#FFF5F5' }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDrop(e, null)}>
          <p className="text-xs font-semibold mb-2" style={{ color: '#F44336' }}>
            Sin asignar ({unassigned.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {unassigned.map(g => <GuestChip key={g.key} guest={g} />)}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from(tables.entries()).map(([tableNum, tableGuests]) => {
          const adults = tableGuests.filter(g => !g.isChild).length
          const children = tableGuests.filter(g => g.isChild).length
          return (
            <div
              key={tableNum}
              className="rounded-xl border p-3 min-h-[100px] transition-colors"
              style={{
                backgroundColor: '#fff',
                borderColor: '#E5D5C5',
              }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, tableNum)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>
                  Mesa {tableNum}
                </span>
                <span className="text-xs rounded-full px-2 py-0.5"
                  style={{ backgroundColor: '#FAF7F4', color: '#9D8A7A' }}>
                  {adults > 0 && `${adults} adulto${adults !== 1 ? 's' : ''}`}
                  {adults > 0 && children > 0 && ' · '}
                  {children > 0 && `${children} niño${children !== 1 ? 's' : ''}`}
                  {tableGuests.length === 0 && 'Vacía'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tableGuests.map(g => <GuestChip key={g.key} guest={g} />)}
              </div>
              {tableGuests.length === 0 && (
                <p className="text-xs text-center mt-3" style={{ color: '#ccc' }}>Arrastra invitados aquí</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
