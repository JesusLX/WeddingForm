'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { Wedding } from '@/lib/types'

export function ConfigForm({ wedding, userId }: { wedding: Wedding | null; userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    slug: wedding?.slug ?? '',
    partner_1: wedding?.partner_1 ?? '',
    partner_2: wedding?.partner_2 ?? '',
    wedding_date: wedding?.wedding_date ?? '',
    ceremony_time: wedding?.ceremony_time ?? '',
    ceremony_venue: wedding?.ceremony_venue ?? '',
    ceremony_address: wedding?.ceremony_address ?? '',
    ceremony_maps_url: wedding?.ceremony_maps_url ?? '',
    same_venue: wedding?.same_venue ?? false,
    reception_time: wedding?.reception_time ?? '',
    reception_venue: wedding?.reception_venue ?? '',
    reception_address: wedding?.reception_address ?? '',
    reception_maps_url: wedding?.reception_maps_url ?? '',
    our_story: wedding?.our_story ?? '',
    dress_code: wedding?.dress_code ?? '',
    dress_code_notes: wedding?.dress_code_notes ?? '',
    rsvp_deadline: wedding?.rsvp_deadline ?? '',
    bank_iban: wedding?.bank_iban ?? '',
    bank_holder: wedding?.bank_holder ?? '',
    bank_concept: wedding?.bank_concept ?? '',
    gifts_text: wedding?.gifts_text ?? '',
    bus_enabled: wedding?.bus_enabled ?? true,
    is_published: wedding?.is_published ?? false,
  })

  function set(key: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function save() {
    setSaving(true)
    setMessage('')

    const payload = {
      ...form,
      user_id: userId,
      slug: form.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      ceremony_time: form.ceremony_time || null,
      reception_time: form.reception_time || null,
      rsvp_deadline: form.rsvp_deadline || null,
    }

    let error
    if (wedding?.id) {
      ;({ error } = await supabase.from('weddings').update(payload).eq('id', wedding.id))
    } else {
      ;({ error } = await supabase.from('weddings').insert(payload))
    }

    setSaving(false)
    if (error) { setMessage('Error: ' + error.message); return }
    setMessage('¡Guardado correctamente!')
    router.refresh()
  }

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }
  const labelClass = 'block text-xs font-medium mb-1 uppercase tracking-wide'
  const labelStyle = { color: '#555555' }
  const sectionClass = 'rounded-2xl p-5 space-y-4'
  const sectionStyle = { backgroundColor: 'white', border: '1px solid #F4D7D7' }

  return (
    <div className="space-y-6">
      {/* Basic info */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Información básica</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Novio/a 1</label>
            <input value={form.partner_1} onChange={(e) => set('partner_1', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="Jesús" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Novio/a 2</label>
            <input value={form.partner_2} onChange={(e) => set('partner_2', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="María" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Fecha de boda</label>
            <input type="date" value={form.wedding_date} onChange={(e) => set('wedding_date', e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>URL de la página</label>
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: '#888' }}>/boda/</span>
              <input value={form.slug} onChange={(e) => set('slug', e.target.value)}
                className={inputClass} style={inputStyle} placeholder="jesus-y-maria" />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Nuestra historia</label>
          <textarea value={form.our_story} onChange={(e) => set('our_story', e.target.value)}
            rows={4} className={inputClass} style={{ ...inputStyle, resize: 'none' }}
            placeholder="Cuéntale a vuestros invitados cómo os conocisteis..." />
        </div>
      </div>

      {/* Ceremony */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Ceremonia</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Hora</label>
            <input type="time" value={form.ceremony_time} onChange={(e) => set('ceremony_time', e.target.value)}
              className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Nombre del lugar</label>
            <input value={form.ceremony_venue} onChange={(e) => set('ceremony_venue', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="Iglesia de..." />
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Dirección</label>
          <input value={form.ceremony_address} onChange={(e) => set('ceremony_address', e.target.value)}
            className={inputClass} style={inputStyle} placeholder="Calle, número, ciudad" />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>URL de Google Maps</label>
          <input value={form.ceremony_maps_url} onChange={(e) => set('ceremony_maps_url', e.target.value)}
            className={inputClass} style={inputStyle} placeholder="https://maps.google.com/..." />
          <p className="text-xs mt-1" style={{ color: '#888' }}>
            Busca el lugar en Google Maps → Compartir → Copiar enlace
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.same_venue}
            onChange={(e) => set('same_venue', e.target.checked)}
            className="w-4 h-4 rounded" style={{ accentColor: '#C9A84C' }} />
          <span className="text-sm" style={{ color: '#2D2D2D' }}>
            La ceremonia y el convite son en el mismo lugar
          </span>
        </label>
      </div>

      {/* Reception */}
      {!form.same_venue && (
        <div className={sectionClass} style={sectionStyle}>
          <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Convite / Recepción</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass} style={labelStyle}>Hora</label>
              <input type="time" value={form.reception_time} onChange={(e) => set('reception_time', e.target.value)}
                className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className={labelClass} style={labelStyle}>Nombre del lugar</label>
              <input value={form.reception_venue} onChange={(e) => set('reception_venue', e.target.value)}
                className={inputClass} style={inputStyle} placeholder="Finca, restaurante..." />
            </div>
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Dirección</label>
            <input value={form.reception_address} onChange={(e) => set('reception_address', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="Calle, número, ciudad" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>URL de Google Maps</label>
            <input value={form.reception_maps_url} onChange={(e) => set('reception_maps_url', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="https://maps.google.com/..." />
          </div>
        </div>
      )}

      {/* Dress code */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Código de vestimenta</h2>
        <div>
          <label className={labelClass} style={labelStyle}>Tipo de vestimenta</label>
          <input value={form.dress_code} onChange={(e) => set('dress_code', e.target.value)}
            className={inputClass} style={inputStyle}
            placeholder="Ej: Etiqueta, Smart Casual, Cocktail..." />
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Notas adicionales (opcional)</label>
          <textarea value={form.dress_code_notes} onChange={(e) => set('dress_code_notes', e.target.value)}
            rows={2} className={inputClass} style={{ ...inputStyle, resize: 'none' }}
            placeholder="Ej: Evitar el color blanco, colores claros bienvenidos..." />
        </div>
      </div>

      {/* Gifts */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Regalos y cuenta bancaria</h2>
        <div>
          <label className={labelClass} style={labelStyle}>Texto sobre regalos</label>
          <textarea value={form.gifts_text} onChange={(e) => set('gifts_text', e.target.value)}
            rows={3} className={inputClass} style={{ ...inputStyle, resize: 'none' }}
            placeholder="Vuestra presencia es el mejor regalo. Si queréis hacernos una aportación..." />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass} style={labelStyle}>Titular</label>
            <input value={form.bank_holder} onChange={(e) => set('bank_holder', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="Nombre Apellido" />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>IBAN</label>
            <input value={form.bank_iban} onChange={(e) => set('bank_iban', e.target.value)}
              className={inputClass} style={inputStyle} placeholder="ES00 0000 0000 ..." />
          </div>
        </div>
        <div>
          <label className={labelClass} style={labelStyle}>Concepto</label>
          <input value={form.bank_concept} onChange={(e) => set('bank_concept', e.target.value)}
            className={inputClass} style={inputStyle}
            placeholder="Ej: Boda Jesús y María" />
        </div>
      </div>

      {/* RSVP settings */}
      <div className={sectionClass} style={sectionStyle}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Configuración del formulario</h2>
        <div>
          <label className={labelClass} style={labelStyle}>Fecha límite de confirmación</label>
          <input type="date" value={form.rsvp_deadline} onChange={(e) => set('rsvp_deadline', e.target.value)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300"
            style={inputStyle} />
        </div>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.bus_enabled}
            onChange={(e) => set('bus_enabled', e.target.checked)}
            className="w-4 h-4 rounded" style={{ accentColor: '#C9A84C' }} />
          <span className="text-sm" style={{ color: '#2D2D2D' }}>Preguntar por autobús</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.is_published}
            onChange={(e) => set('is_published', e.target.checked)}
            className="w-4 h-4 rounded" style={{ accentColor: '#C9A84C' }} />
          <span className="text-sm" style={{ color: '#2D2D2D' }}>
            Página publicada (visible para los invitados)
          </span>
        </label>
      </div>

      {message && (
        <p
          className="text-sm text-center"
          style={{ color: message.startsWith('Error') ? '#EF5350' : '#4CAF50' }}
        >
          {message}
        </p>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
        style={{ backgroundColor: '#C9A84C' }}
      >
        {saving ? 'Guardando...' : wedding ? 'Guardar cambios' : 'Crear mi boda'}
      </button>
    </div>
  )
}
