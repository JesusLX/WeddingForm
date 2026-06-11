'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { cardClass, cardStyle, UI } from '@/lib/ui'

const DAYS_OPTIONS = [3, 7, 14, 30]

export function RecordatoriosManager({
  weddingId,
  initialEnabled,
  initialDaysBefore,
  initialLastSent,
  pendingWithEmail,
}: {
  weddingId: string
  initialEnabled: boolean
  initialDaysBefore: number
  initialLastSent: string | null
  pendingWithEmail: number
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [daysBefore, setDaysBefore] = useState(initialDaysBefore)
  const [lastSent, setLastSent] = useState(initialLastSent)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  function showMsg(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 4000)
  }

  async function saveSettings(newEnabled: boolean, newDays: number) {
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ reminder_enabled: newEnabled, reminder_days_before: newDays })
      .eq('id', weddingId)
    setSaving(false)
    if (error) showMsg('Error al guardar')
  }

  function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    saveSettings(next, daysBefore)
  }

  function changeDays(days: number) {
    setDaysBefore(days)
    saveSettings(enabled, days)
  }

  async function sendNow() {
    setSending(true)
    setMessage('')
    const res = await fetch('/api/reminders/send', { method: 'POST' })
    const json = await res.json()
    setSending(false)
    if (!res.ok || json.error) {
      showMsg(json.error ?? 'Error al enviar')
    } else {
      setLastSent(new Date().toISOString())
      showMsg(`✓ ${json.sent} email${json.sent !== 1 ? 's' : ''} enviado${json.sent !== 1 ? 's' : ''}`)
    }
  }

  const lastSentStr = lastSent
    ? new Date(lastSent).toLocaleDateString('es-ES', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : null

  return (
    <div className="space-y-4">
      {/* Toggle */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={toggleEnabled}
            disabled={saving}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50"
            style={{ backgroundColor: enabled ? UI.primary : '#D1D5DB' }}
            aria-pressed={enabled}
          >
            <span
              className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
              style={{ transform: enabled ? 'translateX(20px)' : 'translateX(4px)' }}
            />
          </button>
          <span className="text-sm font-medium" style={{ color: UI.dark }}>
            {enabled ? 'Recordatorios activados' : 'Recordatorios desactivados'}
          </span>
        </div>
        <p className="text-xs" style={{ color: UI.muted }}>
          Activa esto para poder enviar recordatorios a los invitados que no han confirmado.
        </p>
      </div>

      {/* Config */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>
          Enviar recordatorio
        </h3>

        <div
          className="flex items-center justify-between p-3 rounded-xl mb-4"
          style={{ backgroundColor: `${UI.primary}10` }}
        >
          <p className="text-sm" style={{ color: UI.dark }}>
            Invitados sin confirmar con email
          </p>
          <span
            className="text-lg font-semibold"
            style={{ color: UI.primary }}
          >
            {pendingWithEmail}
          </span>
        </div>

        {pendingWithEmail === 0 ? (
          <p className="text-sm" style={{ color: UI.muted }}>
            No hay invitados pendientes con email. Asegúrate de añadir emails en la lista de invitados.
          </p>
        ) : (
          <button
            onClick={sendNow}
            disabled={sending || !enabled}
            className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: UI.primary }}
          >
            {sending ? 'Enviando...' : `Enviar ahora a ${pendingWithEmail} invitado${pendingWithEmail !== 1 ? 's' : ''}`}
          </button>
        )}

        {!enabled && pendingWithEmail > 0 && (
          <p className="text-xs mt-2 text-center" style={{ color: UI.muted }}>
            Activa los recordatorios para poder enviar
          </p>
        )}

        {lastSentStr && (
          <p className="text-xs mt-3" style={{ color: UI.muted }}>
            Último envío: {lastSentStr}
          </p>
        )}
      </div>

      {/* Days before (for future scheduled sending) */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: UI.dark }}>
          Días de antelación
        </h3>
        <p className="text-xs mb-3" style={{ color: UI.muted }}>
          Para recordatorio automático, ¿con cuántos días de antelación a la boda?
        </p>
        <div className="flex gap-2 flex-wrap">
          {DAYS_OPTIONS.map(d => (
            <button
              key={d}
              onClick={() => changeDays(d)}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                backgroundColor: daysBefore === d ? UI.primary : `${UI.primary}15`,
                color: daysBefore === d ? 'white' : UI.primary,
              }}
            >
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* API key notice */}
      <div
        className="rounded-xl px-4 py-3 text-xs"
        style={{ backgroundColor: `${UI.accent}80`, color: UI.text }}
      >
        Para activar los envíos necesitas configurar la variable de entorno{' '}
        <code className="font-mono">RESEND_API_KEY</code> con tu clave de{' '}
        <a href="https://resend.com" target="_blank" rel="noopener noreferrer" style={{ color: UI.primary }}>
          resend.com
        </a>.
      </div>

      {message && (
        <p
          className="text-sm text-center"
          style={{ color: message.startsWith('Error') || message.startsWith('error') ? UI.error : UI.success }}
        >
          {message}
        </p>
      )}
    </div>
  )
}
