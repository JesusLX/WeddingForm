'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { TimelineEvent } from '@/lib/types'

export function TimelineManager({
  weddingId,
  initialTimeline,
}: {
  weddingId: string
  initialTimeline: TimelineEvent[]
}) {
  const [events, setEvents] = useState<TimelineEvent[]>(initialTimeline)
  const [time, setTime] = useState('')
  const [label, setLabel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function saveTimeline(updated: TimelineEvent[]) {
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ event_timeline: updated })
      .eq('id', weddingId)
    setSaving(false)
    if (!error) setMessage('¡Guardado!')
    setTimeout(() => setMessage(''), 2000)
  }

  function addEvent() {
    if (!time || !label.trim()) return
    const updated = [...events, { time, label: label.trim() }].sort((a, b) =>
      a.time.localeCompare(b.time)
    )
    setEvents(updated)
    saveTimeline(updated)
    setTime('')
    setLabel('')
  }

  function removeEvent(i: number) {
    const updated = events.filter((_, idx) => idx !== i)
    setEvents(updated)
    saveTimeline(updated)
  }

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <p className="text-sm" style={{ color: '#555' }}>
          Añade los momentos del día con su hora. Se ordenarán automáticamente.
        </p>

        <div className="flex gap-2">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, width: 110 }}
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Comienzo de la ceremonia"
            className={inputClass}
            style={{ ...inputStyle, flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && addEvent()}
          />
          <button
            onClick={addEvent}
            disabled={saving || !time || !label.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Añadir
          </button>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#888' }}>Sin eventos todavía</p>
        ) : (
          <ul className="space-y-2">
            {events.map((ev, i) => (
              <li
                key={i}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-sm" style={{ color: '#C9A84C', minWidth: 45 }}>{ev.time}</span>
                  <span className="text-sm" style={{ color: '#2D2D2D' }}>{ev.label}</span>
                </div>
                <button onClick={() => removeEvent(i)} className="text-sm hover:opacity-60" style={{ color: '#EF5350' }}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {message && <p className="text-sm text-center" style={{ color: '#4CAF50' }}>{message}</p>}
      </div>
    </div>
  )
}
