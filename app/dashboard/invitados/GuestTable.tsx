'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createClient } from '@/lib/supabase'
const busLabels: Record<string, string> = {
  none: '—',
  outbound: 'Solo ida 🚌',
  return: 'Solo vuelta 🚌',
  both: 'Ida y vuelta 🔄',
}

interface MenuRef {
  id: string
  name: string
  emoji: string
}

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

function menuLabel(id: string | null, opts: MenuRef[]): string {
  if (!id) return '—'
  const opt = opts.find(o => o.id === id)
  return opt ? `${opt.emoji} ${opt.name}` : '?'
}

export function GuestTable({
  responses,
  menuOptions,
}: {
  responses: Response[]
  menuOptions: MenuRef[]
}) {
  const [tab, setTab] = useState<'all' | 'confirmed' | 'declined'>('all')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState(responses)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar la confirmación de "${name}"? El invitado podrá volver a enviar el formulario.`)) return
    setDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from('rsvp_responses').delete().eq('id', id)
    if (error) {
      alert(`Error al eliminar: ${error.message}`)
      setDeleting(null)
      return
    }
    await Promise.all([
      supabase.from('table_assignments').delete().like('guest_key', `${id}_%`),
      supabase.from('guest_relationships').delete().or(`guest_a_key.like.${id}_%,guest_b_key.like.${id}_%`),
    ])
    setItems(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const filtered = items.filter((r) => {
    const matchesTab = tab === 'all' || (tab === 'confirmed' ? r.attendance : !r.attendance)
    const matchesSearch = r.guest_name.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const confirmed = items.filter((r) => r.attendance).length
  const declined = items.filter((r) => !r.attendance).length

  function exportCSV() {
    const headers = [
      'Nombre', 'Asiste', 'Adultos', 'Nombres adultos', 'Menú adultos',
      'Niños', 'Nombres niños', 'Menú niños',
      'Autobús', 'Alergias', 'Canción', 'Mensaje', 'Fecha',
    ]
    const rows = items.map((r) => [
      r.guest_name,
      r.attendance ? 'Sí' : 'No',
      r.adults_count,
      (r.adult_names ?? []).join('; ') || r.guest_name,
      (r.adult_menus ?? []).map((id, i) => `A${i + 1}: ${menuLabel(id, menuOptions)}`).join('; '),
      r.children_count,
      (r.children_names ?? []).join('; '),
      (r.children_menus ?? []).map((id, i) => `N${i + 1}: ${menuLabel(id, menuOptions)}`).join('; '),
      busLabels[r.bus_option] ?? r.bus_option,
      r.allergies ?? '',
      r.song_request ?? '',
      r.message ?? '',
      format(new Date(r.submitted_at), 'dd/MM/yyyy HH:mm'),
    ])
    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'confirmaciones.csv'
    a.click()
  }

  const tabs = [
    { key: 'all', label: `Todos (${responses.length})` },
    { key: 'confirmed', label: `Confirmados (${confirmed})` },
    { key: 'declined', label: `No asisten (${declined})` },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as any)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-all"
              style={{
                backgroundColor: tab === t.key ? '#C9A84C' : 'white',
                color: tab === t.key ? 'white' : '#555555',
                border: '1px solid #F4D7D7',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre..."
            className="px-3 py-1.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300"
            style={{ borderColor: '#F4D7D7', minWidth: 180 }}
          />
          <button
            onClick={exportCSV}
            className="px-4 py-1.5 rounded-xl text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#2D2D2D', color: 'white' }}
          >
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
                  {['Nombre', 'Asiste', 'Adultos', 'Menús', 'Niños', 'Autobús', 'Alergias', 'Canción', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide" style={{ color: '#555555' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    style={{ backgroundColor: i % 2 === 0 ? 'white' : '#FAFAFA', borderTop: '1px solid #F4D7D7' }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#2D2D2D', minWidth: 160 }}>
                      <div className="flex items-start gap-1">
                        <div>
                          <span>{r.guest_name}</span>
                          {(r.adult_names ?? []).filter(Boolean).length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {(r.adult_names ?? []).filter(Boolean).map((n, idx) => (
                                <div key={idx} className="text-xs" style={{ color: '#888' }}>+ {n}</div>
                              ))}
                            </div>
                          )}
                          {(r.children_names ?? []).filter(Boolean).length > 0 && (
                            <div className="mt-0.5 space-y-0.5">
                              {(r.children_names ?? []).filter(Boolean).map((n, idx) => (
                                <div key={idx} className="text-xs" style={{ color: '#888' }}>👶 {n}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        {r.message && (
                          <span title={r.message} className="cursor-help text-xs flex-shrink-0" style={{ color: '#C9A84C' }}>
                            💌
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: r.attendance ? '#E8F5E9' : '#FFEBEE',
                          color: r.attendance ? '#388E3C' : '#C62828',
                        }}
                      >
                        {r.attendance ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#555' }}>{r.adults_count}</td>
                    <td className="px-4 py-3" style={{ color: '#555', minWidth: 160 }}>
                      {(r.adult_menus ?? []).length > 0 ? (
                        <div className="space-y-0.5">
                          {(r.adult_menus ?? []).map((id, idx) => (
                            <div key={idx} className="text-xs">
                              {r.adults_count > 1 ? <span className="text-gray-400">A{idx + 1}: </span> : null}
                              {menuLabel(id, menuOptions)}
                            </div>
                          ))}
                          {(r.children_menus ?? []).filter(Boolean).map((id, idx) => (
                            <div key={`c${idx}`} className="text-xs">
                              <span className="text-gray-400">N{idx + 1}: </span>
                              {menuLabel(id, menuOptions)}
                            </div>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#555' }}>
                      {r.has_children ? r.children_count : '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#555' }}>
                      {busLabels[r.bus_option] ?? '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate" style={{ color: '#555' }} title={r.allergies ?? ''}>
                      {r.allergies || '—'}
                    </td>
                    <td className="px-4 py-3 max-w-[150px] truncate" style={{ color: '#555' }} title={r.song_request ?? ''}>
                      {r.song_request || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: '#888', fontSize: 11 }}>
                      {format(new Date(r.submitted_at), 'dd/MM/yy HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(r.id, r.guest_name)}
                        disabled={deleting === r.id}
                        title="Eliminar confirmación"
                        className="text-xs px-2 py-1 rounded-lg transition-opacity hover:opacity-70 disabled:opacity-40"
                        style={{ color: '#C62828', backgroundColor: '#FFEBEE' }}
                      >
                        {deleting === r.id ? '...' : '🗑'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
