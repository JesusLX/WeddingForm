'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { WeddingEvent } from '@/lib/types'
import { cardClass, cardStyle, inputClass, inputStyle, primaryButtonClass, primaryButtonStyle, UI } from '@/lib/ui'

type FormValues = {
  name: string
  event_date: string
  event_time: string
  venue: string
  address: string
  maps_url: string
  description: string
}

const emptyForm: FormValues = {
  name: '', event_date: '', event_time: '',
  venue: '', address: '', maps_url: '', description: '',
}

// Defined outside to keep a stable reference across renders
function Field({
  label, fieldKey, f, setF, type = 'text', placeholder = '', full = false,
}: {
  label: string
  fieldKey: keyof FormValues
  f: FormValues
  setF: (v: FormValues) => void
  type?: string
  placeholder?: string
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium mb-1" style={{ color: UI.text }}>{label}</label>
      <input
        type={type}
        className={inputClass}
        style={inputStyle}
        placeholder={placeholder}
        value={f[fieldKey]}
        onChange={e => setF({ ...f, [fieldKey]: e.target.value })}
      />
    </div>
  )
}

function EventFormFields({ f, setF }: { f: FormValues; setF: (v: FormValues) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Nombre del evento *" fieldKey="name"       f={f} setF={setF} placeholder="Ej: Comida del día siguiente" full />
      <Field label="Fecha *"             fieldKey="event_date" f={f} setF={setF} type="date" />
      <Field label="Hora"                fieldKey="event_time" f={f} setF={setF} type="time" />
      <Field label="Lugar"               fieldKey="venue"      f={f} setF={setF} placeholder="Nombre del sitio" />
      <Field label="Dirección"           fieldKey="address"    f={f} setF={setF} placeholder="Dirección completa" />
      <Field label="Google Maps URL"     fieldKey="maps_url"   f={f} setF={setF} placeholder="https://maps.google.com/..." />
      <div className="col-span-2">
        <label className="block text-xs font-medium mb-1" style={{ color: UI.text }}>Descripción</label>
        <textarea
          className={inputClass}
          style={{ ...inputStyle, resize: 'vertical' }}
          rows={2}
          placeholder="Detalles adicionales..."
          value={f.description}
          onChange={e => setF({ ...f, description: e.target.value })}
        />
      </div>
    </div>
  )
}

export function EventosManager({
  weddingId,
  weddingSlug,
  initialEvents,
}: {
  weddingId: string
  weddingSlug: string
  initialEvents: WeddingEvent[]
}) {
  const [events, setEvents]     = useState<WeddingEvent[]>(initialEvents)
  const [form, setForm]         = useState<FormValues>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<FormValues>(emptyForm)
  const [saving, setSaving]     = useState(false)
  const [message, setMessage]   = useState('')
  const [copied, setCopied]     = useState<string | null>(null)
  const [secretLabel, setSecretLabel] = useState('')
  const supabase = createClient()

  function eventUrl(accessKey: string) {
    return `${window.location.origin}/boda/${weddingSlug}/e/${accessKey}`
  }

  function organizerUrl(editKey: string) {
    return `${window.location.origin}/boda/${weddingSlug}/organizar/${editKey}`
  }

  async function copyText(text: string, copyId: string) {
    await navigator.clipboard.writeText(text)
    setCopied(copyId)
    setTimeout(() => setCopied(null), 2000)
  }

  async function copyUrl(accessKey: string) {
    await copyText(eventUrl(accessKey), accessKey)
  }

  function showMsg(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function addEvent() {
    if (!form.name.trim() || !form.event_date) return
    setSaving(true)
    const { data, error } = await supabase
      .from('wedding_events')
      .insert({
        wedding_id:  weddingId,
        name:        form.name.trim(),
        event_date:  form.event_date,
        event_time:  form.event_time || null,
        venue:       form.venue.trim() || null,
        address:     form.address.trim() || null,
        maps_url:    form.maps_url.trim() || null,
        description: form.description.trim() || null,
        sort_order:  events.length,
      })
      .select()
      .single()
    setSaving(false)
    if (error) { showMsg('Error al guardar'); return }
    setEvents([...events, data as WeddingEvent])
    setForm(emptyForm)
    showMsg('Evento añadido')
  }

  function startEdit(ev: WeddingEvent) {
    setEditingId(ev.id)
    setEditForm({
      name:        ev.name,
      event_date:  ev.event_date ?? '',
      event_time:  ev.event_time ?? '',
      venue:       ev.venue ?? '',
      address:     ev.address ?? '',
      maps_url:    ev.maps_url ?? '',
      description: ev.description ?? '',
    })
  }

  async function saveEdit() {
    if (!editingId || !editForm.name.trim() || !editForm.event_date) return
    setSaving(true)
    const { error } = await supabase
      .from('wedding_events')
      .update({
        name:        editForm.name.trim(),
        event_date:  editForm.event_date,
        event_time:  editForm.event_time || null,
        venue:       editForm.venue.trim() || null,
        address:     editForm.address.trim() || null,
        maps_url:    editForm.maps_url.trim() || null,
        description: editForm.description.trim() || null,
      })
      .eq('id', editingId)
    setSaving(false)
    if (error) { showMsg('Error al guardar'); return }
    setEvents(events.map(ev =>
      ev.id === editingId
        ? { ...ev, ...editForm, event_time: editForm.event_time || null, venue: editForm.venue.trim() || null, address: editForm.address.trim() || null, maps_url: editForm.maps_url.trim() || null, description: editForm.description.trim() || null }
        : ev
    ))
    setEditingId(null)
    showMsg('Guardado')
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('wedding_events').delete().eq('id', id)
    if (error) { showMsg('Error al eliminar'); return }
    setEvents(events.filter(ev => ev.id !== id))
  }

  async function addSecretEvent() {
    if (!secretLabel.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('wedding_events')
      .insert({
        wedding_id: weddingId,
        name: 'Evento secreto',
        is_secret: true,
        secret_label: secretLabel.trim(),
        sort_order: events.length,
      })
      .select('id, wedding_id, sort_order, access_key, is_secret, edit_key, secret_label, created_at')
      .single()
    setSaving(false)
    if (error || !data) { showMsg('Error al crear el evento secreto'); return }
    setEvents([...events, {
      ...data,
      name: 'Evento secreto',
      event_date: null, event_time: null,
      venue: null, address: null, maps_url: null, description: null,
    } as WeddingEvent])
    setSecretLabel('')
    showMsg('Evento secreto creado')
  }

  return (
    <div className="space-y-4">
      {/* Add new event */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>Añadir evento</h3>
        <EventFormFields f={form} setF={setForm} />
        <button
          onClick={addEvent}
          disabled={saving || !form.name.trim() || !form.event_date}
          className={`${primaryButtonClass} mt-4`}
          style={primaryButtonStyle}
        >
          Añadir evento
        </button>
      </div>

      {/* Add secret event */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: UI.dark }}>🔒 Crear evento secreto</h3>
        <p className="text-xs mb-3" style={{ color: UI.muted }}>
          Para despedidas y sorpresas: tú no podrás ver los detalles. Dale el enlace de
          organización a una persona de confianza para que los rellene, y comparte el
          enlace de invitación con los asistentes.
        </p>
        <div className="flex gap-2">
          <input
            value={secretLabel}
            onChange={e => setSecretLabel(e.target.value)}
            placeholder="Etiqueta para ti (ej: Despedida de Ana)"
            className={inputClass + ' min-w-0 flex-1'}
            style={inputStyle}
            onKeyDown={e => e.key === 'Enter' && addSecretEvent()}
          />
          <button
            onClick={addSecretEvent}
            disabled={saving || !secretLabel.trim()}
            className={`${primaryButtonClass} flex-shrink-0`}
            style={{ ...primaryButtonStyle, backgroundColor: UI.dark }}
          >
            Crear
          </button>
        </div>
      </div>

      {/* Event list */}
      {events.length === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: UI.muted }}>
          Sin eventos extra todavía
        </p>
      ) : (
        <div className="space-y-3">
          {events.map(ev => (
            <div key={ev.id} className={cardClass} style={cardStyle}>
              {ev.is_secret ? (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: UI.dark }}>
                      🔒 {ev.secret_label || 'Evento secreto'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: UI.muted }}>
                      Los detalles son secretos: los gestiona quien tenga el enlace de organización.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {ev.edit_key && (
                        <button
                          onClick={() => copyText(organizerUrl(ev.edit_key!), `edit-${ev.id}`)}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{ color: 'white', backgroundColor: UI.dark }}
                        >
                          {copied === `edit-${ev.id}` ? 'Copiado ✓' : '🔑 Copiar enlace de organización'}
                        </button>
                      )}
                      <button
                        onClick={() => copyText(eventUrl(ev.access_key), `share-${ev.id}`)}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ color: UI.primary, backgroundColor: `${UI.primary}15` }}
                      >
                        {copied === `share-${ev.id}` ? 'Copiado ✓' : '💌 Copiar invitación'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEvent(ev.id)}
                    className="text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
                    style={{ color: UI.error, backgroundColor: `${UI.error}20` }}
                  >
                    Eliminar
                  </button>
                </div>
              ) : editingId === ev.id ? (
                <div className="space-y-3">
                  <EventFormFields f={editForm} setF={setEditForm} />
                  <div className="flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className={primaryButtonClass}
                      style={primaryButtonStyle}
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2.5 rounded-xl text-sm"
                      style={{ color: UI.muted }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm" style={{ color: UI.dark }}>{ev.name}</p>
                    {ev.event_date && (
                      <p className="text-xs mt-0.5" style={{ color: UI.primary }}>
                        {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                      </p>
                    )}
                    {ev.venue && <p className="text-xs mt-0.5" style={{ color: UI.text }}>{ev.venue}</p>}
                    {ev.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: UI.muted }}>{ev.description}</p>}
                    {ev.access_key && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs truncate max-w-[180px]" style={{ color: UI.muted }}>
                          /boda/{weddingSlug}/e/{ev.access_key.slice(0, 8)}…
                        </span>
                        <button
                          onClick={() => copyUrl(ev.access_key)}
                          className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                          style={{ color: copied === ev.access_key ? UI.success : UI.primary, backgroundColor: `${UI.primary}15` }}
                        >
                          {copied === ev.access_key ? 'Copiado ✓' : 'Copiar enlace'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => startEdit(ev)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ color: UI.primary, backgroundColor: `${UI.primary}20` }}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteEvent(ev.id)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ color: UI.error, backgroundColor: `${UI.error}20` }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {message && (
        <p className="text-sm text-center" style={{ color: message.startsWith('Error') ? UI.error : UI.success }}>
          {message}
        </p>
      )}
    </div>
  )
}
