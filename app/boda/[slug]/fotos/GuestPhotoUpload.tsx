'use client'
import { useState, useRef } from 'react'

export function GuestPhotoUpload({ weddingId }: { weddingId: string }) {
  const [guestName, setGuestName]   = useState('')
  const [caption, setCaption]       = useState('')
  const [files, setFiles]           = useState<File[]>([])
  const [previews, setPreviews]     = useState<string[]>([])
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState<{ done: number; total: number } | null>(null)
  const [doneCount, setDoneCount]   = useState<number | null>(null)
  const [error, setError]           = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    if (!selected.length) return
    setFiles(selected)
    setError('')
    setPreviews(selected.map(f => URL.createObjectURL(f)))
  }

  function removeFile(idx: number) {
    URL.revokeObjectURL(previews[idx])
    setFiles(f => f.filter((_, i) => i !== idx))
    setPreviews(p => p.filter((_, i) => i !== idx))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!files.length) { setError('Selecciona al menos una foto'); return }
    setUploading(true)
    setError('')
    setProgress({ done: 0, total: files.length })

    let sent = 0
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      body.append('wedding_id', weddingId)
      if (guestName.trim()) body.append('guest_name', guestName.trim())
      if (caption.trim())   body.append('caption', caption.trim())

      const res  = await fetch('/api/guest-photos/upload', { method: 'POST', body })
      const json = await res.json()
      if (!res.ok || json.error) {
        setError(json.error ?? 'Error al subir una foto')
        setUploading(false)
        setProgress(null)
        return
      }
      sent++
      setProgress({ done: sent, total: files.length })
    }

    setUploading(false)
    setProgress(null)
    setDoneCount(sent)
  }

  const inputBase =
    'w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-offset-0'

  if (doneCount !== null) {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: 'var(--w-accent)' }}>
        <svg className="mx-auto mb-3" viewBox="0 0 48 48" width="48" height="48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="var(--w-primary)" strokeWidth="1.5"/>
          <path d="M14 24l7 7 13-14" stroke="var(--w-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-xl italic mb-2"
          style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
          {doneCount === 1 ? '¡Foto enviada!' : `¡${doneCount} fotos enviadas!`}
        </p>
        <p className="text-sm" style={{ color: '#666' }}>
          La pareja las revisará y las añadirá a la galería. ¡Gracias!
        </p>
        <button
          onClick={() => { setDoneCount(null); setFiles([]); setPreviews([]); setGuestName(''); setCaption('') }}
          className="mt-4 text-sm px-4 py-2 rounded-xl"
          style={{ color: 'var(--w-primary)', backgroundColor: 'var(--w-bg)' }}
        >
          Subir más fotos
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Drop / select area */}
      {previews.length === 0 ? (
        <div
          className="rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer p-10"
          style={{ borderColor: 'var(--w-accent)', backgroundColor: 'var(--w-accent)' }}
          onClick={() => inputRef.current?.click()}
        >
          <svg className="mb-3" viewBox="0 0 24 24" width="36" height="36" fill="none"
            stroke="var(--w-primary)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--w-dark)' }}>
            Toca para seleccionar fotos
          </p>
          <p className="text-xs mt-1" style={{ color: '#888' }}>
            Desde la galería · JPG, PNG, WEBP · máx 10 MB c/u
          </p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white', lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{ color: 'var(--w-primary)', backgroundColor: 'color-mix(in srgb, var(--w-primary) 12%, transparent)' }}
          >
            + Añadir más fotos
          </button>
        </div>
      )}

      {/* Hidden file input — no capture, multiple allowed */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileChange}
      />

      <input
        className={inputBase}
        style={{ borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }}
        placeholder="Tu nombre (opcional)"
        value={guestName}
        onChange={e => setGuestName(e.target.value)}
        maxLength={80}
      />

      <input
        className={inputBase}
        style={{ borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }}
        placeholder="Añade un mensaje o pie de foto (opcional)"
        value={caption}
        onChange={e => setCaption(e.target.value)}
        maxLength={200}
      />

      {error && <p className="text-sm text-center" style={{ color: '#EF5350' }}>{error}</p>}

      <button
        type="submit"
        disabled={uploading || !files.length}
        className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: 'var(--w-primary)' }}
      >
        {uploading && progress
          ? `Subiendo ${progress.done + 1} de ${progress.total}...`
          : files.length > 1
            ? `Enviar ${files.length} fotos`
            : 'Enviar foto'}
      </button>
    </form>
  )
}
