'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { getSpotifyEmbedUrl } from '@/lib/utils'

export function SpotifyManager({ weddingId, initialUrl }: { weddingId: string; initialUrl: string }) {
  const [url, setUrl] = useState(initialUrl)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const embedUrl = getSpotifyEmbedUrl(url)

  async function save() {
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ spotify_playlist_url: url || null })
      .eq('id', weddingId)
    setSaving(false)
    setMessage(error ? 'Error al guardar' : '¡Guardado!')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <p className="text-sm" style={{ color: '#555' }}>
          Pega el enlace de tu playlist de Spotify. Se mostrará en tu página de boda y los invitados
          podrán sugerir canciones en el formulario.
        </p>
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://open.spotify.com/playlist/..."
            className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300"
            style={{ borderColor: '#F4D7D7', color: '#2D2D2D' }}
          />
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Guardar
          </button>
        </div>
        {message && <p className="text-sm" style={{ color: '#4CAF50' }}>{message}</p>}
        {!embedUrl && url && (
          <p className="text-sm" style={{ color: '#EF5350' }}>
            URL de Spotify no válida. Asegúrate de copiar el enlace desde Spotify → Compartir.
          </p>
        )}
      </div>

      {embedUrl && (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #F4D7D7' }}>
          <iframe
            src={embedUrl}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Vista previa de la playlist"
          />
        </div>
      )}
    </div>
  )
}
