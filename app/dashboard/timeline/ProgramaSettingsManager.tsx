'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { cardClass, cardStyle, inputClass, inputStyle, UI } from '@/lib/ui'

export function ProgramaSettingsManager({
  weddingId,
  slug,
  initialEnabled,
  initialCustomUrl,
}: {
  weddingId: string
  slug: string
  initialEnabled: boolean
  initialCustomUrl: string
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [customUrl, setCustomUrl] = useState(initialCustomUrl)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const defaultUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/boda/${slug}/programa`
  const qrTarget = customUrl.trim() || defaultUrl
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrTarget)}&color=2D2D2D&bgcolor=FAF7F4`

  async function save(newEnabled: boolean, newUrl: string) {
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ program_enabled: newEnabled, program_custom_url: newUrl.trim() || null })
      .eq('id', weddingId)
    setSaving(false)
    if (error) {
      setMessage('Error al guardar')
    } else {
      setMessage('¡Guardado!')
    }
    setTimeout(() => setMessage(''), 2000)
  }

  function toggle() {
    const next = !enabled
    setEnabled(next)
    save(next, customUrl)
  }

  return (
    <div className={cardClass} style={cardStyle}>
      <h2 className="text-base font-semibold mb-1" style={{ color: UI.dark }}>
        Página pública del programa
      </h2>
      <p className="text-sm mb-4" style={{ color: UI.muted }}>
        Activa una página accesible por QR donde los invitados puedan ver el programa del día.
      </p>

      {/* Toggle */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={toggle}
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
          {enabled ? 'Página activa' : 'Página desactivada'}
        </span>
      </div>

      {enabled && (
        <div className="space-y-4">
          {/* Custom URL */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: UI.text }}>
              URL personalizada (opcional)
            </label>
            <input
              className={inputClass}
              style={inputStyle}
              placeholder={defaultUrl}
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              onBlur={() => save(enabled, customUrl)}
            />
            <p className="text-xs mt-1" style={{ color: UI.muted }}>
              Si lo dejas vacío se usa la URL por defecto: <code className="text-xs">/boda/{slug}/programa</code>
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div
              className="rounded-xl p-3 flex-shrink-0"
              style={{ backgroundColor: '#FAF7F4', border: `1px solid ${UI.accent}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR del programa" width={180} height={180} className="block" />
            </div>
            <div className="text-sm space-y-1" style={{ color: UI.text }}>
              <p className="font-medium" style={{ color: UI.dark }}>Código QR del programa</p>
              <p style={{ color: UI.muted }}>
                Imprime este QR o inclúyelo en tu papelería. Los invitados podrán escanear para ver el programa en su móvil.
              </p>
              <a
                href={qrSrc}
                download="qr-programa.png"
                className="inline-block mt-2 text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${UI.primary}20`, color: UI.primary }}
              >
                Descargar QR
              </a>
            </div>
          </div>
        </div>
      )}

      {message && (
        <p className="text-sm mt-3" style={{ color: message.startsWith('Error') ? UI.error : UI.success }}>
          {message}
        </p>
      )}
    </div>
  )
}
