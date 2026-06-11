'use client'
import { useState } from 'react'

type EventData = {
  name: string
  event_date: string | null
  event_time: string | null
  venue: string | null
  address: string | null
  maps_url: string | null
  description: string | null
  access_key: string
  secret_label: string | null
}

export function SecretEventEditor({
  editKey,
  weddingSlug,
  weddingNames,
  initialEvent,
}: {
  editKey: string
  weddingSlug: string
  weddingNames: string
  initialEvent: EventData
}) {
  const [name, setName] = useState(initialEvent.name === 'Evento secreto' ? '' : initialEvent.name)
  const [eventDate, setEventDate] = useState(initialEvent.event_date ?? '')
  const [eventTime, setEventTime] = useState(initialEvent.event_time?.slice(0, 5) ?? '')
  const [venue, setVenue] = useState(initialEvent.venue ?? '')
  const [address, setAddress] = useState(initialEvent.address ?? '')
  const [mapsUrl, setMapsUrl] = useState(initialEvent.maps_url ?? '')
  const [description, setDescription] = useState(initialEvent.description ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/boda/${weddingSlug}/e/${initialEvent.access_key}`
    : ''

  async function copyShareUrl() {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function save() {
    if (!name.trim() || !eventDate) return
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/secret-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          edit_key: editKey,
          name: name.trim(),
          event_date: eventDate,
          event_time: eventTime,
          venue,
          address,
          maps_url: mapsUrl,
          description,
        }),
      })
      const body = await res.json()
      if (!res.ok) {
        setMessage(body.error ?? 'Error al guardar')
      } else {
        setMessage('¡Guardado! La invitación ya está actualizada.')
      }
    } catch {
      setMessage('Error de conexión, inténtalo de nuevo')
    }
    setSaving(false)
    setTimeout(() => setMessage(''), 4000)
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2'
  const inputStyle = {
    borderColor: 'var(--w-accent)',
    backgroundColor: 'white',
    color: 'var(--w-dark)',
  }
  const labelClass = 'block text-xs font-medium mb-1'
  const labelStyle = { color: 'var(--w-dark)', opacity: 0.7 }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <p className="uppercase tracking-[0.25em] text-xs mb-2" style={{ color: 'var(--w-primary)' }}>
          {weddingNames}
        </p>
        <h1 className="text-3xl italic" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
          Organizar evento secreto
        </h1>
        {initialEvent.secret_label && (
          <p className="text-sm mt-2" style={{ color: 'var(--w-dark)', opacity: 0.6 }}>
            {initialEvent.secret_label}
          </p>
        )}
        <p className="text-sm mt-3 leading-relaxed" style={{ color: 'var(--w-dark)', opacity: 0.55 }}>
          Los novios no pueden ver estos detalles desde su panel. 🤫
          <br />Rellena los datos y comparte el enlace de la invitación con los asistentes.
        </p>
      </div>

      <div
        className="rounded-2xl p-6 space-y-4 shadow-sm"
        style={{ backgroundColor: 'white', border: '1px solid var(--w-accent)' }}
      >
        <div>
          <label className={labelClass} style={labelStyle}>Nombre del evento *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Despedida de soltera"
            className={inputClass}
            style={inputStyle}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} style={labelStyle}>Fecha *</label>
            <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className={labelClass} style={labelStyle}>Hora</label>
            <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Lugar</label>
          <input value={venue} onChange={e => setVenue(e.target.value)} placeholder="Nombre del sitio" className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Dirección</label>
          <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Dirección completa" className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Google Maps URL</label>
          <input value={mapsUrl} onChange={e => setMapsUrl(e.target.value)} placeholder="https://maps.google.com/..." className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className={labelClass} style={labelStyle}>Descripción</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            placeholder="Detalles para los asistentes..."
            className={inputClass}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <button
          onClick={save}
          disabled={saving || !name.trim() || !eventDate}
          className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: 'var(--w-primary)' }}
        >
          {saving ? 'Guardando...' : 'Guardar evento'}
        </button>

        {message && (
          <p className="text-sm text-center" style={{ color: message.startsWith('¡') ? '#4CAF50' : '#EF5350' }}>
            {message}
          </p>
        )}
      </div>

      {/* Share link */}
      <div
        className="rounded-2xl p-5 mt-5 text-center"
        style={{ backgroundColor: 'var(--w-accent)', border: '1px solid color-mix(in srgb, var(--w-primary) 25%, transparent)' }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--w-dark)' }}>
          Enlace de la invitación
        </p>
        <p className="text-xs break-all mb-3" style={{ color: 'var(--w-dark)', opacity: 0.6 }}>
          {shareUrl}
        </p>
        <button
          onClick={copyShareUrl}
          className="px-5 py-2 rounded-full text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--w-primary)' }}
        >
          {copied ? 'Copiado ✓' : 'Copiar enlace para compartir'}
        </button>
      </div>
    </div>
  )
}
