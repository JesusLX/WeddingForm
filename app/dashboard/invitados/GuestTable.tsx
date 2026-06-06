'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase'

const busLabels: Record<string, string> = {
  none: '—', outbound: 'Solo ida 🚌', return: 'Solo vuelta 🚌', both: 'Ida y vuelta 🔄',
}

interface MenuRef { id: string; name: string; emoji: string }

interface Response {
  id: string
  guest_name: string
  attendance: boolean
  adults_count: number
  adult_names: string[]
  adult_menus: string[]
  has_children: boolean
  children_count: number
  children_names: string[]
  children_menus: (string | null)[]
  bus_option: string
  allergies: string | null
  song_request: string | null
  message: string | null
  submitted_at: string
}

interface PersonRow {
  rsvpId: string
  personKey: string
  name: string
  isChild: boolean
  personIndex: number
  menu: string | null
  // only on first row of group
  isGroupFirst: boolean
  groupSize: number
  attendance: boolean
  busOption: string
  allergies: string | null
  songRequest: string | null
  message: string | null
  submittedAt: string
}

function menuLabel(id: string | null, opts: MenuRef[]): string {
  if (!id) return '—'
  const opt = opts.find(o => o.id === id)
  return opt ? `${opt.emoji} ${opt.name}` : '?'
}

function flattenResponses(responses: Response[]): PersonRow[] {
  const rows: PersonRow[] = []
  for (const r of responses) {
    const adultNames = r.adult_names?.length ? r.adult_names : [r.guest_name]
    const childNames = r.children_names ?? []
    const groupSize = r.adults_count + (r.has_children ? r.children_count : 0)
    const shared = {
      rsvpId: r.id, attendance: r.attendance, busOption: r.bus_option,
      allergies: r.allergies, songRequest: r.song_request, message: r.message,
      submittedAt: r.submitted_at, groupSize,
    }
    for (let i = 0; i < r.adults_count; i++) {
      rows.push({
        ...shared,
        personKey: `${r.id}_adult_${i}`,
        name: adultNames[i] || (i === 0 ? r.guest_name : `Adulto ${i + 1}`),
        isChild: false, personIndex: i,
        menu: r.adult_menus?.[i] ?? null,
        isGroupFirst: i === 0,
      })
    }
    if (r.has_children) {
      for (let i = 0; i < r.children_count; i++) {
        rows.push({
          ...shared,
          personKey: `${r.id}_child_${i}`,
          name: childNames[i] || `Niño ${i + 1}`,
          isChild: true, personIndex: i,
          menu: r.children_menus?.[i] ?? null,
          isGroupFirst: false,
        })
      }
    }
  }
  return rows
}

export function GuestTable({ responses, menuOptions }: { responses: Response[]; menuOptions: MenuRef[] }) {
  const [tab, setTab] = useState<'all' | 'confirmed' | 'declined'>('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<Response[]>(responses)
  const [deleting, setDeleting] = useState<string | null>(null)

  const allRows = flattenResponses(items)

  // Names that appear more than once across all rows (case-insensitive)
  const nameCounts = new Map<string, number>()
  allRows.forEach(row => {
    const key = row.name.trim().toLowerCase()
    nameCounts.set(key, (nameCounts.get(key) ?? 0) + 1)
  })
  const duplicateNames = new Set(
    [...nameCounts.entries()].filter(([, count]) => count > 1).map(([name]) => name)
  )

  const filtered = allRows.filter(row => {
    const matchesTab = tab === 'all' || (tab === 'confirmed' ? row.attendance : !row.attendance)
    const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const confirmedCount = items.filter(r => r.attendance).length
  const declinedCount = items.filter(r => !r.attendance).length
  const totalPeople = items.filter(r => r.attendance)
    .reduce((sum, r) => sum + r.adults_count + (r.has_children ? r.children_count : 0), 0)

  async function handleDeletePerson(row: PersonRow) {
    const resp = items.find(r => r.id === row.rsvpId)!
    const label = row.isChild ? `al niño "${row.name}"` : `a "${row.name}"`
    if (!confirm(`¿Eliminar ${label}? ${row.groupSize > 1 ? 'El resto del grupo seguirá confirmado.' : 'El invitado podrá volver a enviar el formulario.'}`)) return

    setDeleting(row.personKey)
    const supabase = createClient()

    if (row.groupSize <= 1) {
      // Delete whole RSVP
      const { error } = await supabase.from('rsvp_responses').delete().eq('id', row.rsvpId)
      if (error) { alert(`Error: ${error.message}`); setDeleting(null); return }
      await Promise.all([
        supabase.from('table_assignments').delete().like('guest_key', `${row.rsvpId}_%`),
        supabase.from('guest_relationships').delete().or(`guest_a_key.like.${row.rsvpId}_%,guest_b_key.like.${row.rsvpId}_%`),
      ])
      setItems(prev => prev.filter(r => r.id !== row.rsvpId))
    } else if (!row.isChild) {
      const newNames = (resp.adult_names ?? []).filter((_, i) => i !== row.personIndex)
      const newMenus = (resp.adult_menus ?? []).filter((_, i) => i !== row.personIndex)
      const newCount = resp.adults_count - 1
      const { error } = await supabase.from('rsvp_responses').update({
        adults_count: newCount, adult_names: newNames, adult_menus: newMenus,
      }).eq('id', row.rsvpId)
      if (error) { alert(`Error: ${error.message}`); setDeleting(null); return }
      await Promise.all([
        supabase.from('table_assignments').delete().eq('guest_key', row.personKey),
        supabase.from('guest_relationships').delete().or(`guest_a_key.eq.${row.personKey},guest_b_key.eq.${row.personKey}`),
      ])
      setItems(prev => prev.map(r => r.id !== row.rsvpId ? r : {
        ...r, adults_count: newCount, adult_names: newNames, adult_menus: newMenus,
      }))
    } else {
      const newNames = (resp.children_names ?? []).filter((_, i) => i !== row.personIndex)
      const newMenus = (resp.children_menus ?? []).filter((_, i) => i !== row.personIndex)
      const newCount = resp.children_count - 1
      const { error } = await supabase.from('rsvp_responses').update({
        children_count: newCount, has_children: newCount > 0,
        children_names: newNames, children_menus: newMenus,
      }).eq('id', row.rsvpId)
      if (error) { alert(`Error: ${error.message}`); setDeleting(null); return }
      await Promise.all([
        supabase.from('table_assignments').delete().eq('guest_key', row.personKey),
        supabase.from('guest_relationships').delete().or(`guest_a_key.eq.${row.personKey},guest_b_key.eq.${row.personKey}`),
      ])
      setItems(prev => prev.map(r => r.id !== row.rsvpId ? r : {
        ...r, children_count: newCount, has_children: newCount > 0,
        children_names: newNames, children_menus: newMenus,
      }))
    }
    setDeleting(null)
  }

  function exportCSV() {
    const headers = ['Nombre', 'Asiste', 'Tipo', 'Menú', 'Autobús', 'Alergias', 'Canción', 'Mensaje', 'Fecha']
    const rows = allRows.map(row => [
      row.name,
      row.attendance ? 'Sí' : 'No',
      row.isChild ? 'Niño' : 'Adulto',
      menuLabel(row.menu, menuOptions),
      row.isGroupFirst ? (busLabels[row.busOption] ?? row.busOption) : '',
      row.isGroupFirst ? (row.allergies ?? '') : '',
      row.isGroupFirst ? (row.songRequest ?? '') : '',
      row.isGroupFirst ? (row.message ?? '') : '',
      row.isGroupFirst ? format(new Date(row.submittedAt), 'dd/MM/yyyy HH:mm') : '',
    ])
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'confirmaciones.csv'
    a.click()
  }

  const tabs = [
    { key: 'all', label: `Todos (${items.length} envíos · ${totalPeople} personas)` },
    { key: 'confirmed', label: `Confirmados (${confirmedCount})` },
    { key: 'declined', label: `No asisten (${declinedCount})` },
  ]

  // Track group boundaries for visual separation
  let prevRsvpId = ''

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key as any)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{ backgroundColor: tab === t.key ? '#C9A84C' : 'white', color: tab === t.key ? 'white' : '#555555', border: '1px solid #F4D7D7' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="px-3 py-1.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300"
            style={{ borderColor: '#F4D7D7', minWidth: 180 }} />
          <button onClick={exportCSV}
            className="px-4 py-1.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#2D2D2D', color: 'white' }}>
            ↓ CSV
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
          <p style={{ color: '#888' }}>Sin confirmaciones todavía</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F4D7D7' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F9EEE8' }}>
                  {['Nombre', 'Asiste', 'Menú', 'Autobús', 'Alergias', 'Canción', 'Fecha', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#555555' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => {
                  const isNewGroup = row.rsvpId !== prevRsvpId
                  prevRsvpId = row.rsvpId
                  const isDuplicate = duplicateNames.has(row.name.trim().toLowerCase())
                  return (
                    <tr key={row.personKey}
                      title={isDuplicate ? '⚠️ Este nombre aparece más de una vez' : undefined}
                      style={{
                        backgroundColor: isDuplicate ? '#FFFBEB' : i % 2 === 0 ? 'white' : '#FAFAFA',
                        borderTop: isNewGroup && i > 0 ? '2px solid #F4D7D7' : '1px solid #F4D7D799',
                        borderLeft: isDuplicate ? '3px solid #F59E0B' : '3px solid transparent',
                      }}>
                      {/* Name */}
                      <td className="px-4 py-2.5 font-medium" style={{ color: '#2D2D2D', minWidth: 160 }}>
                        <div className="flex items-center gap-1.5">
                          {!row.isGroupFirst && <span className="text-gray-300 select-none">└</span>}
                          {row.isChild && <span title="Niño">👶</span>}
                          <span>{row.name}</span>
                          {isDuplicate && (
                            <span title="Nombre duplicado — posible doble registro" className="text-xs flex-shrink-0">⚠️</span>
                          )}
                          {row.isGroupFirst && row.message && (
                            <span title={row.message} className="cursor-help text-xs flex-shrink-0" style={{ color: '#C9A84C' }}>💌</span>
                          )}
                        </div>
                      </td>
                      {/* Asiste — only first of group */}
                      <td className="px-4 py-2.5">
                        {row.isGroupFirst ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: row.attendance ? '#E8F5E9' : '#FFEBEE', color: row.attendance ? '#388E3C' : '#C62828' }}>
                            {row.attendance ? 'Sí' : 'No'}
                          </span>
                        ) : null}
                      </td>
                      {/* Menú — per person */}
                      <td className="px-4 py-2.5" style={{ color: '#555', minWidth: 130 }}>
                        {menuLabel(row.menu, menuOptions)}
                      </td>
                      {/* Bus — only first of group */}
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: '#555' }}>
                        {row.isGroupFirst ? (busLabels[row.busOption] ?? '—') : null}
                      </td>
                      {/* Alergias — only first of group */}
                      <td className="px-4 py-2.5 max-w-[130px] truncate" style={{ color: '#555' }} title={row.isGroupFirst ? (row.allergies ?? '') : ''}>
                        {row.isGroupFirst ? (row.allergies || '—') : null}
                      </td>
                      {/* Canción — only first of group */}
                      <td className="px-4 py-2.5 max-w-[130px]" style={{ color: '#555' }}>
                        {row.isGroupFirst ? (
                          row.songRequest ? (
                            <a
                              href={`https://open.spotify.com/search/${encodeURIComponent(row.songRequest)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`Buscar "${row.songRequest}" en Spotify`}
                              className="flex items-center gap-1 hover:opacity-70 truncate"
                              style={{ color: '#1DB954' }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
                                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                              </svg>
                              <span className="truncate">{row.songRequest}</span>
                            </a>
                          ) : '—'
                        ) : null}
                      </td>
                      {/* Fecha — only first of group */}
                      <td className="px-4 py-2.5 whitespace-nowrap" style={{ color: '#888', fontSize: 11 }}>
                        {row.isGroupFirst ? format(new Date(row.submittedAt), 'dd/MM/yy HH:mm') : null}
                      </td>
                      {/* Delete */}
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => handleDeletePerson(row)}
                          disabled={deleting === row.personKey}
                          title="Eliminar persona"
                          className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                          style={{ color: '#C62828', backgroundColor: '#FFEBEE' }}>
                          {deleting === row.personKey ? '...' : '🗑'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
