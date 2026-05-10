'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { extractSheetId } from '@/lib/utils'

const SERVICE_ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_SHEETS_SERVICE_ACCOUNT_EMAIL ?? 'tu-service-account@proyecto.iam.gserviceaccount.com'

export function SheetsManager({ weddingId, initialSheetId }: { weddingId: string; initialSheetId: string }) {
  const [sheetUrl, setSheetUrl] = useState(
    initialSheetId ? `https://docs.google.com/spreadsheets/d/${initialSheetId}` : ''
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  async function save() {
    const sheetId = extractSheetId(sheetUrl)
    if (!sheetId) {
      setMessage('URL no válida. Copia el enlace directamente desde Google Sheets.')
      return
    }
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ google_sheet_id: sheetId })
      .eq('id', weddingId)
    setSaving(false)
    setMessage(error ? 'Error al guardar' : '¡Google Sheets conectado!')
    setTimeout(() => setMessage(''), 3000)
  }

  const connected = !!extractSheetId(sheetUrl)

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 space-y-5" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <div>
          <p className="font-medium text-sm mb-3" style={{ color: '#2D2D2D' }}>
            Cómo conectar tu Google Sheet
          </p>
          <ol className="space-y-3">
            {[
              <>Crea una <strong>hoja de cálculo nueva</strong> en Google Sheets.</>,
              <>Haz clic en <strong>Compartir</strong> y añade este email con permisos de <strong>Editor</strong>:</>,
              <>Copia el email de abajo y pégalo en el campo de compartir.</>,
              <>Pega la URL de tu hoja en el campo inferior y guarda.</>,
            ].map((step, i) => (
              <li key={i} className="flex gap-3 text-sm" style={{ color: '#555' }}>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: '#F9EEE8', color: '#C9A84C' }}
                >
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Service account email */}
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ backgroundColor: '#F9EEE8' }}
        >
          <code className="text-sm break-all" style={{ color: '#2D2D2D' }}>
            {SERVICE_ACCOUNT_EMAIL}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(SERVICE_ACCOUNT_EMAIL)}
            className="ml-3 text-xs px-2 py-1 rounded-lg flex-shrink-0 hover:opacity-80"
            style={{ backgroundColor: '#C9A84C22', color: '#C9A84C' }}
          >
            Copiar
          </button>
        </div>

        {/* Sheet URL input */}
        <div>
          <label className="block text-xs font-medium mb-1 uppercase tracking-wide" style={{ color: '#555' }}>
            URL de tu Google Sheet
          </label>
          <div className="flex gap-2">
            <input
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: '#F4D7D7', color: '#2D2D2D' }}
            />
            <button
              onClick={save}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: '#C9A84C' }}
            >
              Conectar
            </button>
          </div>
          {message && (
            <p className="mt-2 text-sm" style={{ color: message.includes('Error') ? '#EF5350' : '#4CAF50' }}>
              {message}
            </p>
          )}
        </div>

        {connected && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}
          >
            <span>✅</span>
            <span>Google Sheets conectado. Las nuevas confirmaciones se añadirán automáticamente.</span>
          </div>
        )}
      </div>
    </div>
  )
}
