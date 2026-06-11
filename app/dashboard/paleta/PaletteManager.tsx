'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase'

const PALETTES = [
  { name: 'Romántico Clásico',   bg: '#FAF7F4', accent: '#F4D7D7', primary: '#C9A84C', dark: '#2D2D2D' },
  { name: 'Azul Mediterráneo',   bg: '#F4F7FA', accent: '#D7E4F4', primary: '#4C7AC9', dark: '#1D3557' },
  { name: 'Verde Jardín',        bg: '#F5FAF5', accent: '#D7F0DB', primary: '#5A9E6A', dark: '#1A3A22' },
  { name: 'Terracota',           bg: '#FAF4F0', accent: '#F4D7C7', primary: '#C9724C', dark: '#3A1A0A' },
  { name: 'Lila Romántico',      bg: '#F8F5FB', accent: '#E4D7F4', primary: '#9A72C9', dark: '#2A1A3A' },
  { name: 'Gris Moderno',        bg: '#F6F6F6', accent: '#E2E2E2', primary: '#6B6B6B', dark: '#1A1A1A' },
]

function hexToHsl(hex: string): [number, number, number] {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return [0, 0, 50]
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0')
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

function ColorPickerField({
  label, value, onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [hsl, setHsl] = useState<[number, number, number]>(() => hexToHsl(value))
  const ref = useRef<HTMLDivElement>(null)

  const openPicker = useCallback(() => {
    setHsl(hexToHsl(value))
    setOpen(true)
  }, [value])

  function handleSlider(idx: 0 | 1 | 2, v: number) {
    const next = [...hsl] as [number, number, number]
    next[idx] = v
    setHsl(next)
    onChange(hslToHex(next[0], next[1], next[2]))
  }

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  const [h, s, l] = hsl
  const hueGrad = 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)'
  const satGrad = `linear-gradient(to right,hsl(${h},0%,${l}%),hsl(${h},100%,${l}%))`
  const litGrad = `linear-gradient(to right,hsl(${h},${s}%,0%),hsl(${h},${s}%,50%),hsl(${h},${s}%,100%))`

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid #F4D7D7' }}>
        <button
          type="button"
          onClick={() => open ? setOpen(false) : openPicker()}
          className="w-10 h-10 rounded-lg border border-black/10 shadow-sm flex-shrink-0 transition-transform active:scale-95"
          style={{ backgroundColor: value }}
          aria-label={`Seleccionar color ${label}`}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium mb-1" style={{ color: '#2D2D2D' }}>{label}</p>
          <input
            type="text"
            value={value}
            onChange={e => { if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value) }}
            onBlur={e => { if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) onChange(value) }}
            maxLength={7}
            className="w-full px-2 py-1 rounded-lg border text-xs font-mono outline-none focus:ring-2 focus:ring-amber-300"
            style={{ borderColor: '#F4D7D7', color: '#2D2D2D' }}
            placeholder="#000000"
          />
        </div>
      </div>

      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-50 rounded-2xl p-4 shadow-xl w-full space-y-4"
          style={{ backgroundColor: 'white', border: '1px solid #F4D7D7', minWidth: 240 }}
        >
          <style>{`
            .hsl-range { -webkit-appearance: none; appearance: none; width: 100%; height: 12px; border-radius: 6px; outline: none; cursor: pointer; }
            .hsl-range::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.25); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
            .hsl-range::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: white; border: 2px solid rgba(0,0,0,0.25); box-shadow: 0 1px 4px rgba(0,0,0,0.2); }
          `}</style>

          <div>
            <p className="text-xs mb-2" style={{ color: '#888' }}>Matiz</p>
            <input type="range" min={0} max={360} value={h}
              onChange={e => handleSlider(0, Number(e.target.value))}
              className="hsl-range" style={{ background: hueGrad }} />
          </div>

          <div>
            <p className="text-xs mb-2" style={{ color: '#888' }}>Saturación</p>
            <input type="range" min={0} max={100} value={s}
              onChange={e => handleSlider(1, Number(e.target.value))}
              className="hsl-range" style={{ background: satGrad }} />
          </div>

          <div>
            <p className="text-xs mb-2" style={{ color: '#888' }}>Luminosidad</p>
            <input type="range" min={0} max={100} value={l}
              onChange={e => handleSlider(2, Number(e.target.value))}
              className="hsl-range" style={{ background: litGrad }} />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg border border-black/10 flex-shrink-0" style={{ backgroundColor: value }} />
              <span className="text-xs font-mono" style={{ color: '#888' }}>{value.toUpperCase()}</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ backgroundColor: '#C9A84C', color: 'white' }}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function PaletteManager({
  weddingId, initialBg, initialAccent, initialPrimary, initialDark,
}: {
  weddingId: string
  initialBg: string
  initialAccent: string
  initialPrimary: string
  initialDark: string
}) {
  const [bg, setBg]         = useState(initialBg)
  const [accent, setAccent] = useState(initialAccent)
  const [primary, setPrimary] = useState(initialPrimary)
  const [dark, setDark]     = useState(initialDark)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  function applyPreset(p: typeof PALETTES[0]) {
    setBg(p.bg); setAccent(p.accent); setPrimary(p.primary); setDark(p.dark)
  }

  function isActive(p: typeof PALETTES[0]) {
    return p.bg === bg && p.accent === accent && p.primary === primary && p.dark === dark
  }

  async function save() {
    if (!weddingId) return
    const isHex = (c: string) => /^#[0-9A-Fa-f]{6}$/.test(c)
    if (![bg, accent, primary, dark].every(isHex)) {
      setMessage('Error: los colores deben ser hex válidos (#RRGGBB)')
      setTimeout(() => setMessage(''), 2500)
      return
    }
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
    { label: 'Fondo',        value: bg,      onChange: setBg      },
    { label: 'Acento',       value: accent,  onChange: setAccent  },
    { label: 'Principal',    value: primary, onChange: setPrimary },
    { label: 'Texto oscuro', value: dark,    onChange: setDark    },
  ]

  return (
    <div className="space-y-6">
      {/* Presets */}
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
                  <div key={i} className="w-6 h-6 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: c }} />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {colorFields.map(({ label, value, onChange }) => (
            <ColorPickerField key={label} label={label} value={value} onChange={onChange} />
          ))}
        </div>
      </div>

      {/* Preview */}
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
            <button className="px-5 py-2 rounded-full text-sm text-white font-medium" style={{ backgroundColor: primary }}>
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
