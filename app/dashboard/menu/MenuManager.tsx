'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { MenuOption } from '@/lib/types'

export function MenuManager({ weddingId, initialOptions }: { weddingId: string; initialOptions: MenuOption[] }) {
  const [options, setOptions] = useState<MenuOption[]>(initialOptions)
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('🍽️')
  const [saving, setSaving] = useState(false)
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

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <p className="text-sm" style={{ color: '#555' }}>
          Añade las opciones de menú que ofrecéis. Los invitados elegirán una al confirmar.
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
          <p className="text-sm text-center py-4" style={{ color: '#888' }}>
            Sin opciones todavía
          </p>
        ) : (
          <ul className="space-y-2">
            {options.map((opt) => (
              <li
                key={opt.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                <span className="flex items-center gap-2 text-sm" style={{ color: '#2D2D2D' }}>
                  <span className="text-xl">{opt.emoji}</span>
                  {opt.name}
                </span>
                <button
                  onClick={() => deleteOption(opt.id)}
                  className="text-sm transition-opacity hover:opacity-60"
                  style={{ color: '#EF5350' }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
