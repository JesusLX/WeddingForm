'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

const PALETTES = [
  {
    name: 'Romántico Clásico',
    bg: '#FAF7F4',
    accent: '#F4D7D7',
    primary: '#C9A84C',
    dark: '#2D2D2D',
  },
  {
    name: 'Azul Mediterráneo',
    bg: '#F4F7FA',
    accent: '#D7E4F4',
    primary: '#4C7AC9',
    dark: '#1D3557',
  },
  {
    name: 'Verde Jardín',
    bg: '#F5FAF5',
    accent: '#D7F0DB',
    primary: '#5A9E6A',
    dark: '#1A3A22',
  },
  {
    name: 'Terracota',
    bg: '#FAF4F0',
    accent: '#F4D7C7',
    primary: '#C9724C',
    dark: '#3A1A0A',
  },
  {
    name: 'Lila Romántico',
    bg: '#F8F5FB',
    accent: '#E4D7F4',
    primary: '#9A72C9',
    dark: '#2A1A3A',
  },
  {
    name: 'Gris Moderno',
    bg: '#F6F6F6',
    accent: '#E2E2E2',
    primary: '#6B6B6B',
    dark: '#1A1A1A',
  },
]

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 rounded-full border border-black/10 shadow-sm" style={{ backgroundColor: color }} />
      <span className="text-xs" style={{ color: '#999' }}>{label}</span>
    </div>
  )
}

export function PaletteManager({
  weddingId,
  initialBg,
  initialAccent,
  initialPrimary,
  initialDark,
}: {
  weddingId: string
  initialBg: string
  initialAccent: string
  initialPrimary: string
  initialDark: string
}) {
  const [bg, setBg] = useState(initialBg)
  const [accent, setAccent] = useState(initialAccent)
  const [primary, setPrimary] = useState(initialPrimary)
  const [dark, setDark] = useState(initialDark)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  function applyPreset(p: typeof PALETTES[0]) {
    setBg(p.bg)
    setAccent(p.accent)
    setPrimary(p.primary)
    setDark(p.dark)
  }

  function isActive(p: typeof PALETTES[0]) {
    return p.bg === bg && p.accent === accent && p.primary === primary && p.dark === dark
  }

  async function save() {
    if (!weddingId) return
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ color_bg: bg, color_accent: accent, color_primary: primary, color_dark: dark })
      .eq('id', weddingId)
    setSaving(false)
    setMessage(error ? 'Error al guardar' : '¡Guardado!')
    setTimeout(() => setMessage(''), 2500)
  }

  const colorFields = [
    { label: 'Fondo', value: bg, onChange: setBg },
    { label: 'Acento', value: accent, onChange: setAccent },
    { label: 'Principal', value: primary, onChange: setPrimary },
    { label: 'Texto oscuro', value: dark, onChange: setDark },
  ]

  return (
    <div className="space-y-6">
      {/* Preset palettes */}
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Estilos predefinidos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => applyPreset(p)}
              className="flex flex-col gap-3 p-3 rounded-xl border text-left transition-all hover:shadow-sm"
              style={{
                borderColor: isActive(p) ? p.primary : '#F4D7D7',
                backgroundColor: isActive(p) ? `${p.primary}11` : 'white',
                outline: isActive(p) ? `2px solid ${p.primary}` : 'none',
              }}
            >
              <div className="flex gap-1.5">
                {[p.bg, p.accent, p.primary, p.dark].map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: '#2D2D2D' }}>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom pickers */}
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Colores personalizados</h2>
        <div className="grid grid-cols-2 gap-4">
          {colorFields.map(({ label, value, onChange }) => (
            <div key={label} className="flex items-center gap-3">
              <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-10 h-10 rounded-lg border cursor-pointer"
                style={{ borderColor: '#F4D7D7', padding: 2 }}
              />
              <div>
                <p className="text-xs font-medium" style={{ color: '#2D2D2D' }}>{label}</p>
                <p className="text-xs font-mono" style={{ color: '#999' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview strip */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F4D7D7' }}>
        <div className="px-5 py-3" style={{ backgroundColor: '#FAF7F4' }}>
          <p className="text-xs font-medium" style={{ color: '#888' }}>Vista previa</p>
        </div>
        <div className="p-5 space-y-3" style={{ backgroundColor: bg }}>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color: primary }}>Nuestra boda</p>
          <p className="text-2xl italic" style={{ fontFamily: 'var(--font-playfair)', color: dark }}>
            Ana &amp; Carlos
          </p>
          <div className="h-px w-12" style={{ backgroundColor: primary }} />
          <div className="inline-block px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: accent, color: dark }}>
            Etiqueta de ejemplo
          </div>
          <div>
            <button
              className="px-5 py-2 rounded-full text-sm text-white font-medium"
              style={{ backgroundColor: primary }}
            >
              Confirmar asistencia
            </button>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || !weddingId}
          className="px-5 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: '#C9A84C' }}
        >
          {saving ? 'Guardando...' : 'Guardar paleta'}
        </button>
        {message && (
          <p className="text-sm" style={{ color: message.startsWith('Error') ? '#EF5350' : '#4CAF50' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
