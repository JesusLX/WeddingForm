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
  const [icon, setIcon] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editTime, setEditTime] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editIcon, setEditIcon] = useState('')
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
    const updated = [...events, {
      time,
      label: label.trim(),
      ...(icon.trim() ? { icon: icon.trim() } : {}),
    }].sort((a, b) => a.time.localeCompare(b.time))
    setEvents(updated)
    saveTimeline(updated)
    setTime('')
    setLabel('')
    setIcon('')
  }

  function startEdit(i: number) {
    setEditingIdx(i)
    setEditTime(events[i].time)
    setEditLabel(events[i].label)
    setEditIcon(events[i].icon ?? '')
  }

  function saveEdit() {
    if (editingIdx === null || !editTime || !editLabel.trim()) return
    const updated = events.map((ev, i) =>
      i === editingIdx
        ? { time: editTime, label: editLabel.trim(), ...(editIcon.trim() ? { icon: editIcon.trim() } : {}) }
        : ev
    ).sort((a, b) => a.time.localeCompare(b.time))
    setEvents(updated)
    saveTimeline(updated)
    setEditingIdx(null)
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
          Añade los momentos del día. El icono puede ser un emoji, una URL de imagen o de SVG.
        </p>

        <div className="flex gap-2 flex-wrap">
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className={inputClass}
            style={{ ...inputStyle, width: 110 }}
          />
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🎉 o URL imagen/svg"
            className={inputClass}
            style={{ ...inputStyle, width: 160 }}
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Ej: Comienzo de la ceremonia"
            className={inputClass}
            style={{ ...inputStyle, flex: 1, minWidth: 160 }}
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
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                {editingIdx === i ? (
                  <div className="flex gap-2 flex-wrap items-center">
                    <input
                      type="time"
                      value={editTime}
                      onChange={e => setEditTime(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, width: 110 }}
                    />
                    <input
                      value={editIcon}
                      onChange={e => setEditIcon(e.target.value)}
                      placeholder="🎉 o URL"
                      className={inputClass}
                      style={{ ...inputStyle, width: 140 }}
                    />
                    <input
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      className={inputClass}
                      style={{ ...inputStyle, flex: 1, minWidth: 140 }}
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit()
                        if (e.key === 'Escape') setEditingIdx(null)
                      }}
                    />
                    <button
                      onClick={saveEdit}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                      style={{ backgroundColor: '#4CAF50' }}
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setEditingIdx(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ color: '#888' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="font-semibold text-sm flex-shrink-0" style={{ color: '#C9A84C', minWidth: 45 }}>{ev.time}</span>
                      {ev.icon && (
                        ev.icon.startsWith('http') || ev.icon.startsWith('/') || ev.icon.startsWith('data:') ? (
                          <img src={ev.icon} alt="" className="w-6 h-6 object-contain rounded flex-shrink-0" />
                        ) : (
                          <span className="text-xl flex-shrink-0">{ev.icon}</span>
                        )
                      )}
                      <span className="text-sm truncate" style={{ color: '#2D2D2D' }}>{ev.label}</span>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => startEdit(i)}
                        className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                        style={{ color: '#C9A84C', backgroundColor: '#C9A84C22' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeEvent(i)}
                        className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                        style={{ color: '#EF5350', backgroundColor: '#EF535022' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {message && <p className="text-sm text-center" style={{ color: '#4CAF50' }}>{message}</p>}
      </div>
    </div>
  )
}
