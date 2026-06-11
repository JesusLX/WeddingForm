'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { GuestPhoto } from '@/lib/types'
import { cardClass, cardStyle, UI } from '@/lib/ui'

function PhotoGrid({
  list,
  onApprove,
  onDelete,
}: {
  list: GuestPhoto[]
  onApprove: (id: string) => void
  onDelete: (photo: GuestPhoto) => void
}) {
  if (list.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: UI.muted }}>
        Sin fotos en esta sección
      </p>
    )
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {list.map(photo => (
        <div key={photo.id} className="relative group rounded-xl overflow-hidden" style={{ aspectRatio: '1', backgroundColor: UI.accent }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.photo_url} alt={photo.caption ?? ''} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            {!photo.approved && (
              <button
                onClick={() => onApprove(photo.id)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ backgroundColor: UI.success }}
              >
                Aprobar
              </button>
            )}
            <button
              onClick={() => onDelete(photo)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
              style={{ backgroundColor: UI.error }}
            >
              Eliminar
            </button>
          </div>
          {(photo.guest_name || photo.caption) && (
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-black/50">
              {photo.guest_name && (
                <p className="text-xs text-white font-medium truncate">{photo.guest_name}</p>
              )}
              {photo.caption && (
                <p className="text-xs text-white/80 truncate">{photo.caption}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function GaleriaColabManager({
  weddingId,
  slug,
  initialEnabled,
  initialPhotos,
}: {
  weddingId: string
  slug: string
  initialEnabled: boolean
  initialPhotos: GuestPhoto[]
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [photos, setPhotos] = useState<GuestPhoto[]>(initialPhotos)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  const pending = photos.filter(p => !p.approved)
  const approved = photos.filter(p => p.approved)

  const uploadUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/boda/${slug}/fotos`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uploadUrl)}&color=2D2D2D&bgcolor=FAF7F4`

  function showMsg(msg: string) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function toggleEnabled() {
    const next = !enabled
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ collab_gallery_enabled: next })
      .eq('id', weddingId)
    setSaving(false)
    if (error) { showMsg('Error al guardar'); return }
    setEnabled(next)
  }

  async function approvePhoto(id: string) {
    const { error } = await supabase.from('guest_photos').update({ approved: true }).eq('id', id)
    if (error) { showMsg('Error'); return }
    setPhotos(photos.map(p => p.id === id ? { ...p, approved: true } : p))
  }

  async function deletePhoto(photo: GuestPhoto) {
    const { error } = await supabase.from('guest_photos').delete().eq('id', photo.id)
    if (error) { showMsg('Error al eliminar'); return }
    const urlPath = photo.photo_url.split('/wedding-photos/')[1]
    if (urlPath) {
      await supabase.storage.from('wedding-photos').remove([urlPath])
    }
    setPhotos(photos.filter(p => p.id !== photo.id))
  }

  return (
    <div className="space-y-6">
      {/* Toggle + QR */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex items-center gap-3 mb-4">
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
            {enabled ? 'Galería activa' : 'Galería desactivada'}
          </span>
        </div>

        {enabled && (
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div
              className="rounded-xl p-3 flex-shrink-0"
              style={{ backgroundColor: '#FAF7F4', border: `1px solid ${UI.accent}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="QR galería" width={180} height={180} className="block" />
            </div>
            <div className="text-sm space-y-1" style={{ color: UI.text }}>
              <p className="font-medium" style={{ color: UI.dark }}>QR para subir fotos</p>
              <p style={{ color: UI.muted }}>
                Comparte este QR en la boda para que los invitados suban sus fotos.
                Las fotos se guardan como pendientes hasta que las apruebes.
              </p>
              <a
                href={uploadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs truncate"
                style={{ color: UI.primary }}
              >
                {uploadUrl}
              </a>
              <br />
              <a
                href={qrSrc}
                download="qr-galeria.png"
                className="inline-block mt-1 text-xs px-3 py-1.5 rounded-lg"
                style={{ backgroundColor: `${UI.primary}20`, color: UI.primary }}
              >
                Descargar QR
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Photos */}
      <div className={cardClass} style={cardStyle}>
        <div className="flex mb-4 -mx-1" style={{ borderBottom: `2px solid ${UI.accent}` }}>
          {([
            { key: 'pending', label: `Pendientes (${pending.length})` },
            { key: 'approved', label: `Aprobadas (${approved.length})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-4 py-2 text-sm font-medium transition-colors"
              style={{
                color: tab === t.key ? UI.primary : UI.muted,
                borderBottom: `2px solid ${tab === t.key ? UI.primary : 'transparent'}`,
                marginBottom: -2,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <PhotoGrid
          list={tab === 'pending' ? pending : approved}
          onApprove={approvePhoto}
          onDelete={deletePhoto}
        />
      </div>

      {message && (
        <p className="text-sm text-center" style={{ color: message.startsWith('Error') ? UI.error : UI.success }}>
          {message}
        </p>
      )}
    </div>
  )
}
