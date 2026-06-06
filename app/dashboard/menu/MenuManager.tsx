'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { MenuOption } from '@/lib/types'

export function MenuManager({ weddingId, initialOptions }: { weddingId: string; initialOptions: MenuOption[] }) {
  const [options, setOptions] = useState<MenuOption[]>(initialOptions)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const supabase = createClient()

  async function addOption() {
    if (!name.trim()) return
    setSaving(true)
    const { data } = await supabase
      .from('menu_options')
      .insert({ wedding_id: weddingId, name: name.trim(), emoji, sort_order: options.length })
      .select().single()
    if (data) setOptions((prev) => [...prev, data])
    setName('')
    setEmoji('🍽️')
    setSaving(false)
  }

  async function deleteOption(id: string) {
    await supabase.from('menu_options').delete().eq('id', id)
    setOptions((prev) => prev.filter((o) => o.id !== id))
  }

  function startEdit(opt: MenuOption) {
    setEditingId(opt.id)
    setEditName(opt.name)
    setEditEmoji(opt.emoji)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    await supabase.from('menu_options').update({ name: editName.trim(), emoji: editEmoji }).eq('id', id)
    setOptions(prev => prev.map(o => o.id === id ? { ...o, name: editName.trim(), emoji: editEmoji } : o))
    setEditingId(null)
  }

  async function moveOption(id: string, direction: 'up' | 'down') {
    const idx = options.findIndex(o => o.id === id)
    if (direction === 'up' && idx === 0) return
    if (direction === 'down' && idx === options.length - 1) return
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    const newOptions = [...options]
    ;[newOptions[idx], newOptions[swapIdx]] = [newOptions[swapIdx], newOptions[idx]]
    const withOrder = newOptions.map((opt, i) => ({ ...opt, sort_order: i }))
    setOptions(withOrder)
    await Promise.all(withOrder.map(({ id: oid, sort_order }) =>
      supabase.from('menu_options').update({ sort_order }).eq('id', oid)
    ))
  }

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <p className="text-sm" style={{ color: '#555' }}>
          Añade las opciones de menú que ofrecéis. Cada invitado elegirá la suya individualmente.
        </p>

        <div className="flex gap-2">
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, width: 60, textAlign: 'center', fontSize: 20 }}
            maxLength={2}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Carne, Pescado, Vegetariano..."
            className={inputClass}
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && addOption()}
          />
          <button
            onClick={addOption}
            disabled={saving || !name.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Añadir
          </button>
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#888' }}>Sin opciones todavía</p>
        ) : (
          <ul className="space-y-2">
            {options.map((opt, idx) => (
              <li
                key={opt.id}
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                {/* Reorder arrows */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveOption(opt.id, 'up')}
                    disabled={idx === 0}
                    className="text-xs leading-none px-1 disabled:opacity-20 hover:opacity-60"
                    style={{ color: '#C9A84C' }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveOption(opt.id, 'down')}
                    disabled={idx === options.length - 1}
                    className="text-xs leading-none px-1 disabled:opacity-20 hover:opacity-60"
                    style={{ color: '#C9A84C' }}
                  >
                    ▼
                  </button>
                </div>

                {editingId === opt.id ? (
                  <div className="flex gap-2 items-center flex-1 min-w-0">
                    <input
                      value={editEmoji}
                      onChange={e => setEditEmoji(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, width: 54, textAlign: 'center', fontSize: 18 }}
                      maxLength={2}
                    />
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, flex: 1 }}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit(opt.id)
                        if (e.key === 'Escape') setEditingId(null)
                      }}
                    />
                    <button
                      onClick={() => saveEdit(opt.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: '#4CAF50' }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: '#888' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="flex items-center gap-2 text-sm flex-1" style={{ color: '#2D2D2D' }}>
                    <span className="text-xl">{opt.emoji}</span>
                    {opt.name}
                  </span>
                )}

                {editingId !== opt.id && (
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={() => startEdit(opt)}
                      className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                      style={{ color: '#C9A84C', backgroundColor: '#C9A84C22' }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteOption(opt.id)}
                      className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                      style={{ color: '#EF5350', backgroundColor: '#EF535022' }}
                    >
                      Eliminar
                    </button>
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
