'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { WeddingEvent } from '@/lib/types'
import { cardClass, cardStyle, inputClass, inputStyle, primaryButtonClass, primaryButtonStyle, UI } from '@/lib/ui'

type EventForm = {
  name: string
  event_date: string
  event_time: string
  venue: string
  address: string
  maps_url: string
  description: string
}

const emptyForm: EventForm = {
  name: '', event_date: '', event_time: '',
  venue: '', address: '', maps_url: '', description: '',
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
  const [events, setEvents] = useState<WeddingEvent[]>(initialEvents)
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EventForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const supabase = createClient()

  function eventUrl(accessKey: string) {
    return `${window.location.origin}/boda/${weddingSlug}/e/${accessKey}`
  }

  async function copyUrl(accessKey: string) {
    await navigator.clipboard.writeText(eventUrl(accessKey))
    setCopied(accessKey)
    setTimeout(() => setCopied(null), 2000)
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
        wedding_id: weddingId,
        name: form.name.trim(),
        event_date: form.event_date,
        event_time: form.event_time || null,
        venue: form.venue.trim() || null,
        address: form.address.trim() || null,
        maps_url: form.maps_url.trim() || null,
        description: form.description.trim() || null,
        sort_order: events.length,
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
      name: ev.name,
      event_date: ev.event_date,
      event_time: ev.event_time ?? '',
      venue: ev.venue ?? '',
      address: ev.address ?? '',
      maps_url: ev.maps_url ?? '',
      description: ev.description ?? '',
    })
  }

  async function saveEdit() {
    if (!editingId || !editForm.name.trim() || !editForm.event_date) return
    setSaving(true)
    const { error } = await supabase
      .from('wedding_events')
      .update({
        name: editForm.name.trim(),
        event_date: editForm.event_date,
        event_time: editForm.event_time || null,
        venue: editForm.venue.trim() || null,
        address: editForm.address.trim() || null,
        maps_url: editForm.maps_url.trim() || null,
        description: editForm.description.trim() || null,
      })
      .eq('id', editingId)
    setSaving(false)
    if (error) { showMsg('Error al guardar'); return }
    setEvents(events.map(ev => ev.id === editingId ? { ...ev, ...editForm, event_time: editForm.event_time || null, venue: editForm.venue.trim() || null, address: editForm.address.trim() || null, maps_url: editForm.maps_url.trim() || null, description: editForm.description.trim() || null } : ev))
    setEditingId(null)
    showMsg('Guardado')
  }

  async function deleteEvent(id: string) {
    const { error } = await supabase.from('wedding_events').delete().eq('id', id)
    if (error) { showMsg('Error al eliminar'); return }
    setEvents(events.filter(ev => ev.id !== id))
  }

  const iField = (label: string, key: keyof EventForm, opts?: { type?: string; placeholder?: string; full?: boolean; form: EventForm; setF: (f: EventForm) => void }) => {
    const { type = 'text', placeholder = '', form: f, setF } = opts ?? { form, setF: setForm }
    return (
      <div className={opts?.full ? 'col-span-2' : ''}>
        <label className="block text-xs font-medium mb-1" style={{ color: UI.text }}>{label}</label>
        <input
          type={type}
          className={inputClass}
          style={inputStyle}
          placeholder={placeholder}
          value={f[key]}
          onChange={e => setF({ ...f, [key]: e.target.value })}
        />
      </div>
    )
  }

  const EventForm = ({ f, setF }: { f: EventForm; setF: (f: EventForm) => void }) => (
    <div className="grid grid-cols-2 gap-3">
      {iField('Nombre del evento *', 'name', { placeholder: 'Ej: Comida del día siguiente', full: true, form: f, setF })}
      {iField('Fecha *', 'event_date', { type: 'date', form: f, setF })}
      {iField('Hora', 'event_time', { type: 'time', form: f, setF })}
      {iField('Lugar', 'venue', { placeholder: 'Nombre del sitio', form: f, setF })}
      {iField('Dirección', 'address', { placeholder: 'Dirección completa', form: f, setF })}
      {iField('Google Maps URL', 'maps_url', { placeholder: 'https://maps.google.com/...', form: f, setF })}
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

  return (
    <div className="space-y-4">
      {/* Add new event */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>Añadir evento</h3>
        <EventForm f={form} setF={setForm} />
        <button
          onClick={addEvent}
          disabled={saving || !form.name.trim() || !form.event_date}
          className={`${primaryButtonClass} mt-4`}
          style={primaryButtonStyle}
        >
          Añadir evento
        </button>
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
              {editingId === ev.id ? (
                <div className="space-y-3">
                  <EventForm f={editForm} setF={setEditForm} />
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
                    <p className="text-xs mt-0.5" style={{ color: UI.primary }}>
                      {new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                      {ev.event_time ? ` · ${ev.event_time.slice(0, 5)}` : ''}
                    </p>
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
