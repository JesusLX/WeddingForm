'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { ExpectedGuest } from '@/lib/types'

type GuestWithResponse = ExpectedGuest & {
  rsvp_response: { guest_name: string; attendance: boolean } | null
}

export function GuestListManager({
  weddingId,
  initialGuests,
}: {
  weddingId: string
  initialGuests: GuestWithResponse[]
}) {
  const [guests, setGuests] = useState<GuestWithResponse[]>(initialGuests)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [showCsvImport, setShowCsvImport] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  function showError(message: string) {
    setErrorMsg(message)
    setTimeout(() => setErrorMsg(''), 5000)
  }

  function startEdit(g: GuestWithResponse) {
    setEditingId(g.id)
    setEditName(g.name)
    setEditEmail(g.email ?? '')
    setEditPhone(g.phone ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    const { error } = await supabase
      .from('expected_guests')
      .update({ name: editName.trim(), email: editEmail || null, phone: editPhone || null })
      .eq('id', id)
    if (error) {
      showError(`Error al guardar: ${error.message}`)
      return
    }
    setGuests(prev => prev.map(g =>
      g.id === id ? { ...g, name: editName.trim(), email: editEmail || null, phone: editPhone || null } : g
    ))
    setEditingId(null)
  }

  async function addGuest() {
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('expected_guests')
      .insert({ wedding_id: weddingId, name: name.trim(), email: email || null, phone: phone || null })
      .select().single()
    setSaving(false)
    if (error || !data) {
      showError(`Error al añadir: ${error?.message ?? 'inténtalo de nuevo'}`)
      return
    }
    setGuests((prev) => [...prev, { ...data, rsvp_response: null }])
    setName('')
    setEmail('')
    setPhone('')
  }

  async function deleteGuest(id: string, guestName: string) {
    if (!confirm(`¿Eliminar a "${guestName}" de la lista?`)) return
    const { error } = await supabase.from('expected_guests').delete().eq('id', id)
    if (error) {
      showError(`Error al eliminar: ${error.message}`)
      return
    }
    setGuests((prev) => prev.filter((g) => g.id !== id))
  }

  async function importCSV() {
    const lines = csvText.trim().split('\n').filter(Boolean)
    const rows: { wedding_id: string; name: string; email: string | null; phone: string | null }[] = []
    for (const line of lines) {
      const [guestName, guestEmail, guestPhone] = line.split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
      if (guestName) rows.push({ wedding_id: weddingId, name: guestName, email: guestEmail || null, phone: guestPhone || null })
    }
    if (!rows.length) return
    setSaving(true)
    const { data, error } = await supabase.from('expected_guests').insert(rows).select()
    setSaving(false)
    if (error || !data) {
      showError(`Error al importar: ${error?.message ?? 'formato no válido'}. Revisa el formato e inténtalo de nuevo.`)
      return
    }
    setGuests((prev) => [...prev, ...data.map((g) => ({ ...g, rsvp_response: null }))])
    setCsvText('')
    setShowCsvImport(false)
  }

  const confirmed = guests.filter((g) => g.rsvp_response?.attendance === true).length
  const declined = guests.filter((g) => g.rsvp_response?.attendance === false).length
  const pending = guests.filter((g) => !g.rsvp_response).length

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }
  const editInputClass = 'px-3 py-1.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FDECEA', color: '#B71C1C', border: '1px solid #F5C6C6' }}>
          {errorMsg}
        </div>
      )}
      {/* Stats */}
      {guests.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Confirmados', value: confirmed, color: '#4CAF50' },
            { label: 'No asisten', value: declined, color: '#EF5350' },
            { label: 'Pendientes', value: pending, color: '#C9A84C' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 text-center" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
              <p className="text-2xl font-bold" style={{ color: s.color, fontFamily: 'var(--font-playfair)' }}>{s.value}</p>
              <p className="text-xs" style={{ color: '#555' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        {/* Add single guest */}
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Nombre *" className={inputClass} style={{ ...inputStyle, flex: 2 }}
            onKeyDown={(e) => e.key === 'Enter' && addGuest()} />
          <input value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (opcional)" className={inputClass} style={{ ...inputStyle, flex: 2 }} />
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            placeholder="Teléfono" className={inputClass} style={{ ...inputStyle, flex: 1 }} />
          <button onClick={addGuest} disabled={saving || !name.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}>
            Añadir
          </button>
        </div>

        {/* CSV import */}
        <div>
          <button
            onClick={() => setShowCsvImport(!showCsvImport)}
            className="text-sm underline"
            style={{ color: '#C9A84C' }}
          >
            {showCsvImport ? 'Cancelar importación' : '+ Importar desde CSV'}
          </button>
          {showCsvImport && (
            <div className="mt-3 space-y-2">
              <p className="text-xs" style={{ color: '#888' }}>
                Una línea por invitado: Nombre, Email, Teléfono (email y teléfono son opcionales)
              </p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={5}
                placeholder={'Ana García, ana@email.com, 600000000\nPedro López,,'}
                className={inputClass + ' w-full'}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
              />
              <button
                onClick={importCSV}
                disabled={saving || !csvText.trim()}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: '#2D2D2D' }}
              >
                Importar {csvText.trim().split('\n').filter(Boolean).length} invitados
              </button>
            </div>
          )}
        </div>

        {/* Guest list */}
        {guests.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#888' }}>Sin invitados todavía</p>
        ) : (
          <ul className="space-y-2">
            {guests.map((g) => (
              <li
                key={g.id}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                {editingId === g.id ? (
                  <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Nombre *"
                      className={editInputClass}
                      style={{ ...inputStyle, flex: 2 }}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(g.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <input
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="Email"
                      className={editInputClass}
                      style={{ ...inputStyle, flex: 2 }}
                    />
                    <input
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="Teléfono"
                      className={editInputClass}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <div className="flex gap-1">
                      <button
                        onClick={() => saveEdit(g.id)}
                        disabled={!editName.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                        style={{ backgroundColor: '#4CAF50' }}
                      >
                        ✓
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ color: '#888', backgroundColor: '#0000001a' }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: g.rsvp_response
                          ? g.rsvp_response.attendance ? '#4CAF50' : '#EF5350'
                          : '#C9A84C',
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#2D2D2D' }}>{g.name}</p>
                      {(g.email || g.phone) && (
                        <p className="text-xs truncate" style={{ color: '#888' }}>
                          {[g.email, g.phone].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs hidden sm:inline" style={{ color: g.rsvp_response ? (g.rsvp_response.attendance ? '#4CAF50' : '#EF5350') : '#C9A84C' }}>
                        {g.rsvp_response ? (g.rsvp_response.attendance ? '✅ Confirmado' : '❌ No asiste') : '⏳ Pendiente'}
                      </span>
                      <button
                        onClick={() => startEdit(g)}
                        className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                        style={{ color: '#C9A84C', backgroundColor: '#C9A84C22' }}
                      >
                        Editar
                      </button>
                      <button onClick={() => deleteGuest(g.id, g.name)} className="text-xs hover:opacity-60" style={{ color: '#EF5350' }}>
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
