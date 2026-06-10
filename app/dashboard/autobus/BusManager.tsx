'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { BusRoute } from '@/lib/types'

export function BusManager({ weddingId, initialRoutes }: { weddingId: string; initialRoutes: BusRoute[] }) {
  const [routes, setRoutes] = useState<BusRoute[]>(initialRoutes)
  const [newLabel, setNewLabel] = useState<{ outbound: string; return: string }>({ outbound: '', return: '' })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const supabase = createClient()

  function showError(message: string) {
    setErrorMsg(message)
    setTimeout(() => setErrorMsg(''), 5000)
  }

  async function addRoute(direction: 'outbound' | 'return') {
    const label = newLabel[direction].trim()
    if (!label) return
    setSaving(true)
    const sortOrder = routes.filter(r => r.direction === direction).length
    const { data, error } = await supabase
      .from('bus_routes')
      .insert({ wedding_id: weddingId, direction, label, sort_order: sortOrder })
      .select().single()
    setSaving(false)
    if (error || !data) { showError(`Error al añadir: ${error?.message ?? ''}`); return }
    setRoutes(prev => [...prev, data])
    setNewLabel(prev => ({ ...prev, [direction]: '' }))
  }

  async function deleteRoute(id: string) {
    const { error } = await supabase.from('bus_routes').delete().eq('id', id)
    if (error) { showError(`Error al eliminar: ${error.message}`); return }
    setRoutes(prev => prev.filter(r => r.id !== id))
  }

  function startEdit(route: BusRoute) {
    setEditingId(route.id)
    setEditLabel(route.label)
  }

  async function saveEdit(id: string) {
    if (!editLabel.trim()) return
    const { error } = await supabase.from('bus_routes').update({ label: editLabel.trim() }).eq('id', id)
    if (error) { showError(`Error al guardar: ${error.message}`); return }
    setRoutes(prev => prev.map(r => r.id === id ? { ...r, label: editLabel.trim() } : r))
    setEditingId(null)
  }

  async function moveRoute(id: string, dir: 'up' | 'down') {
    const route = routes.find(r => r.id === id)!
    const group = routes.filter(r => r.direction === route.direction).sort((a, b) => a.sort_order - b.sort_order)
    const idx = group.findIndex(r => r.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === group.length - 1) return
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    const newGroup = [...group]
    ;[newGroup[idx], newGroup[swapIdx]] = [newGroup[swapIdx], newGroup[idx]]
    const withOrder = newGroup.map((r, i) => ({ ...r, sort_order: i }))
    setRoutes(prev => prev.map(r => withOrder.find(w => w.id === r.id) ?? r))
    await Promise.all(withOrder.map(({ id: rid, sort_order }) =>
      supabase.from('bus_routes').update({ sort_order }).eq('id', rid)
    ))
  }

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }

  function renderSection(direction: 'outbound' | 'return', title: string, placeholder: string) {
    const group = routes.filter(r => r.direction === direction).sort((a, b) => a.sort_order - b.sort_order)
    return (
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>
          {direction === 'outbound' ? '➡️' : '⬅️'} {title}
        </h2>
        {group.length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: '#888' }}>Sin opciones todavía</p>
        ) : (
          <ul className="space-y-2">
            {group.map((route, idx) => (
              <li key={route.id} className="flex items-center gap-2 px-4 py-3 rounded-xl" style={{ backgroundColor: '#F9EEE8' }}>
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveRoute(route.id, 'up')} disabled={idx === 0}
                    className="text-xs leading-none px-1 disabled:opacity-20 hover:opacity-60" style={{ color: '#C9A84C' }}>▲</button>
                  <button onClick={() => moveRoute(route.id, 'down')} disabled={idx === group.length - 1}
                    className="text-xs leading-none px-1 disabled:opacity-20 hover:opacity-60" style={{ color: '#C9A84C' }}>▼</button>
                </div>
                {editingId === route.id ? (
                  <div className="flex gap-2 flex-1 min-w-0">
                    <input value={editLabel} onChange={e => setEditLabel(e.target.value)}
                      className={inputClass} style={{ ...inputStyle, flex: 1 }} autoFocus
                      onKeyDown={e => { if (e.key === 'Enter') saveEdit(route.id); if (e.key === 'Escape') setEditingId(null) }} />
                    <button onClick={() => saveEdit(route.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white" style={{ backgroundColor: '#4CAF50' }}>✓</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ color: '#888' }}>✕</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm flex-1" style={{ color: '#2D2D2D' }}>🚌 {route.label}</span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => startEdit(route)} className="text-xs px-2 py-1 rounded-lg hover:opacity-70" style={{ color: '#C9A84C', backgroundColor: '#C9A84C22' }}>Editar</button>
                      <button onClick={() => deleteRoute(route.id)} className="text-xs px-2 py-1 rounded-lg hover:opacity-70" style={{ color: '#EF5350', backgroundColor: '#EF535022' }}>Eliminar</button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newLabel[direction]}
            onChange={e => setNewLabel(prev => ({ ...prev, [direction]: e.target.value }))}
            placeholder={placeholder}
            className={inputClass}
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={e => e.key === 'Enter' && addRoute(direction)}
          />
          <button onClick={() => addRoute(direction)} disabled={saving || !newLabel[direction].trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}>
            Añadir
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: '#FDECEA', color: '#B71C1C', border: '1px solid #F5C6C6' }}>
          {errorMsg}
        </div>
      )}
      <p className="text-sm" style={{ color: '#555' }}>
        Los invitados podrán elegir <strong>una opción de ida</strong> y <strong>una de vuelta</strong> de forma independiente.
        Si no configuras ninguna opción, la sección de autobús no aparece en el formulario.
      </p>
      {renderSection('outbound', 'Ida', 'Ej: Autobús ida 10:00')}
      {renderSection('return', 'Vuelta', 'Ej: Autobús vuelta 23:00')}
    </div>
  )
}
