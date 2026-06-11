'use client'
import { useState, useRef } from 'react'

export function GuestPhotoUpload({ weddingId }: { weddingId: string }) {
  const [guestName, setGuestName] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError('')
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setError('Selecciona una foto'); return }
    setUploading(true)
    setError('')

    const body = new FormData()
    body.append('file', file)
    body.append('wedding_id', weddingId)
    if (guestName.trim()) body.append('guest_name', guestName.trim())
    if (caption.trim()) body.append('caption', caption.trim())

    const res = await fetch('/api/guest-photos/upload', { method: 'POST', body })
    const json = await res.json()
    setUploading(false)

    if (!res.ok || json.error) {
      setError(json.error ?? 'Error al subir la foto')
    } else {
      setDone(true)
    }
  }

  const inputBase =
    'w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-offset-0'

  if (done) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{ backgroundColor: 'var(--w-accent)' }}
      >
        <p className="text-3xl mb-3">📸</p>
        <p
          className="text-xl italic mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
        >
          ¡Foto enviada!
        </p>
        <p className="text-sm" style={{ color: '#666' }}>
          La pareja la revisará y la añadirá a la galería. ¡Gracias!
        </p>
        <button
          onClick={() => { setDone(false); setFile(null); setPreview(null); setGuestName(''); setCaption('') }}
          className="mt-4 text-sm px-4 py-2 rounded-xl"
          style={{ color: 'var(--w-primary)', backgroundColor: 'var(--w-bg)' }}
        >
          Subir otra foto
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* File drop area */}
      <div
        className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors p-8"
        style={{
          borderColor: file ? 'var(--w-primary)' : 'var(--w-accent)',
          backgroundColor: file ? 'transparent' : 'var(--w-accent)',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="max-h-48 rounded-xl object-contain" />
        ) : (
          <>
            <p className="text-3xl mb-2">📷</p>
            <p className="text-sm font-medium" style={{ color: 'var(--w-dark)' }}>
              Toca para seleccionar una foto
            </p>
            <p className="text-xs mt-1" style={{ color: '#888' }}>JPG, PNG, WEBP · máx 10 MB</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div>
        <input
          className={inputBase}
          style={{ borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }}
          placeholder="Tu nombre (opcional)"
          value={guestName}
          onChange={e => setGuestName(e.target.value)}
          maxLength={80}
        />
      </div>

      <div>
        <input
          className={inputBase}
          style={{ borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }}
          placeholder="Añade un mensaje o pie de foto (opcional)"
          value={caption}
          onChange={e => setCaption(e.target.value)}
          maxLength={200}
        />
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: '#EF5350' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={uploading || !file}
        className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: 'var(--w-primary)' }}
      >
        {uploading ? 'Subiendo...' : 'Enviar foto'}
      </button>
    </form>
  )
}
