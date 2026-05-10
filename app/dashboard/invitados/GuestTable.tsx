'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Response {
  id: string
  guest_name: string
  attendance: boolean
  adults_count: number
  has_children: boolean
  children_count: number
  children_want_menu: boolean
  needs_bus: boolean
  allergies: string | null
  song_request: string | null
  message: string | null
  submitted_at: string
  menu_option: { name: string; emoji: string } | null
}

export function GuestTable({ responses }: { responses: Response[] }) {
  const [tab, setTab] = useState<'all' | 'confirmed' | 'declined'>('all')
  const [search, setSearch] = useState('')

  const filtered = responses.filter((r) => {
    const matchesTab =
      tab === 'all' || (tab === 'confirmed' ? r.attendance : !r.attendance)
    const matchesSearch = r.guest_name.toLowerCase().includes(search.toLowerCase())
    return matchesTab && matchesSearch
  })

  const confirmed = responses.filter((r) => r.attendance).length
  const declined = responses.filter((r) => !r.attendance).length

  function exportCSV() {
    const headers = [
      'Nombre', 'Asiste', 'Adultos', 'Niños', 'Menú niños', 'Menú', 'Autobús',
      'Alergias', 'Canción', 'Mensaje', 'Fecha',
    ]
    const rows = responses.map((r) => [
      r.guest_name,
      r.attendance ? 'Sí' : 'No',
      r.adults_count,
      r.children_count,
      r.children_want_menu ? 'Sí' : 'No',
      r.menu_option ? `${r.menu_option.emoji} ${r.menu_option.name}` : '',
      r.needs_bus ? 'Sí' : 'No',
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
      {/* Tabs and export */}
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
        <div
          className="rounded-2xl p-12 text-center"
          style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
        >
          <p style={{ color: '#888' }}>Sin confirmaciones todavía</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F4D7D7' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: '#F9EEE8' }}>
                  {['Nombre', 'Asiste', 'Adultos', 'Niños', 'Menú', 'Autobús', 'Alergias', 'Canción', 'Fecha'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 font-medium text-xs uppercase tracking-wide"
                      style={{ color: '#555555' }}
                    >
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
                    <td className="px-4 py-3 font-medium" style={{ color: '#2D2D2D', minWidth: 140 }}>
                      {r.guest_name}
                      {r.message && (
                        <span
                          title={r.message}
                          className="ml-1 cursor-help text-xs"
                          style={{ color: '#C9A84C' }}
                        >
                          💌
                        </span>
                      )}
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
                    <td className="px-4 py-3 text-center" style={{ color: '#555' }}>
                      {r.has_children ? `${r.children_count} ${r.children_want_menu ? '🍼' : ''}` : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#555' }}>
                      {r.menu_option ? `${r.menu_option.emoji} ${r.menu_option.name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center" style={{ color: '#555' }}>
                      {r.needs_bus ? '🚌 Sí' : '—'}
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
