'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export function GalleryManager({
  weddingId,
  initialImages,
  initialCover,
}: {
  weddingId: string
  initialImages: string[]
  initialCover: string
}) {
  const [images, setImages] = useState<string[]>(initialImages)
  const [cover, setCover] = useState(initialCover)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)
  const [coverMsg, setCoverMsg] = useState('')
  const [galleryMsg, setGalleryMsg] = useState('')
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const coverRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']

  function showMsg(setter: (m: string) => void, msg: string) {
    setter(msg)
    setTimeout(() => setter(''), 3000)
  }

  async function uploadCover(files: FileList) {
    const file = files[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) {
      showMsg(setCoverMsg, 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)')
      return
    }
    setUploadingCover(true)
    const ext = file.name.split('.').pop()
    const path = `${weddingId}/cover-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('wedding-photos').upload(path, file, { upsert: true })
    if (error) {
      setUploadingCover(false)
      showMsg(setCoverMsg, `Error al subir: ${error.message}`)
      return
    }
    const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path)
    await supabase.from('weddings').update({ cover_image_url: data.publicUrl }).eq('id', weddingId)
    setCover(data.publicUrl)
    setUploadingCover(false)
    showMsg(setCoverMsg, '¡Foto de portada guardada!')
  }

  async function uploadGallery(files: FileList) {
    setUploadingGallery(true)
    const uploadedUrls: string[] = []
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showMsg(setGalleryMsg, `${file.name}: tipo no permitido`)
        continue
      }
      const ext = file.name.split('.').pop()
      const path = `${weddingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('wedding-photos').upload(path, file)
      if (error) {
        showMsg(setGalleryMsg, `Error al subir ${file.name}: ${error.message}`)
        continue
      }
      const { data } = supabase.storage.from('wedding-photos').getPublicUrl(path)
      uploadedUrls.push(data.publicUrl)
    }
    if (uploadedUrls.length > 0) {
      const newImages = [...images, ...uploadedUrls]
      const { error } = await supabase.from('weddings').update({ gallery_image_urls: newImages }).eq('id', weddingId)
      if (error) {
        showMsg(setGalleryMsg, `Error al guardar: ${error.message}`)
      } else {
        setImages(newImages)
        showMsg(setGalleryMsg, `${uploadedUrls.length} foto${uploadedUrls.length > 1 ? 's' : ''} añadida${uploadedUrls.length > 1 ? 's' : ''}`)
      }
    }
    setUploadingGallery(false)
  }

  function extractStoragePath(url: string): string | null {
    const marker = '/wedding-photos/'
    const idx = url.indexOf(marker)
    if (idx === -1) return null
    return url.slice(idx + marker.length).split('?')[0]
  }

  async function removeImage(url: string) {
    if (!confirm('¿Eliminar esta foto?')) return
    const newImages = images.filter((i) => i !== url)
    const { error } = await supabase.from('weddings').update({ gallery_image_urls: newImages }).eq('id', weddingId)
    if (error) {
      showMsg(setGalleryMsg, `Error al eliminar: ${error.message}`)
      return
    }
    const path = extractStoragePath(url)
    if (path) await supabase.storage.from('wedding-photos').remove([path])
    setImages(newImages)
  }

  async function removeCover() {
    if (!confirm('¿Eliminar la foto de portada?')) return
    const { error } = await supabase.from('weddings').update({ cover_image_url: null }).eq('id', weddingId)
    if (error) {
      showMsg(setCoverMsg, `Error al eliminar: ${error.message}`)
      return
    }
    const path = extractStoragePath(cover)
    if (path) await supabase.storage.from('wedding-photos').remove([path])
    setCover('')
  }

  function handleDragStart(i: number) {
    setDraggingIndex(i)
  }

  function handleDragOver(e: React.DragEvent, i: number) {
    e.preventDefault()
    setDragOverIndex(i)
  }

  async function handleDrop(i: number) {
    if (draggingIndex === null || draggingIndex === i) {
      setDraggingIndex(null)
      setDragOverIndex(null)
      return
    }
    const previous = images
    const reordered = [...images]
    const [moved] = reordered.splice(draggingIndex, 1)
    reordered.splice(i, 0, moved)
    setImages(reordered)
    setDraggingIndex(null)
    setDragOverIndex(null)
    const { error } = await supabase.from('weddings').update({ gallery_image_urls: reordered }).eq('id', weddingId)
    if (error) {
      setImages(previous)
      showMsg(setGalleryMsg, `Error al reordenar: ${error.message}`)
    }
  }

  function handleDragEnd() {
    setDraggingIndex(null)
    setDragOverIndex(null)
  }

  async function moveImage(i: number, direction: 'prev' | 'next') {
    const j = direction === 'prev' ? i - 1 : i + 1
    if (j < 0 || j >= images.length) return
    const previous = images
    const reordered = [...images]
    ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]
    setImages(reordered)
    const { error } = await supabase.from('weddings').update({ gallery_image_urls: reordered }).eq('id', weddingId)
    if (error) {
      setImages(previous)
      showMsg(setGalleryMsg, `Error al reordenar: ${error.message}`)
    }
  }

  const msgStyle = (msg: string) => ({
    color: msg.startsWith('Error') ? '#EF5350' : '#4CAF50',
  })

  return (
    <div className="space-y-6">
      {/* Cover photo */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>Foto de portada</h2>
        {cover ? (
          <div className="relative rounded-xl" style={{ height: 200 }}>
            <img
              src={cover}
              className="w-full h-full object-cover rounded-xl"
              alt="Portada"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
                className="px-3 py-1.5 rounded-full text-xs font-medium disabled:opacity-50"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
              >
                {uploadingCover ? '...' : 'Cambiar'}
              </button>
              <button
                onClick={removeCover}
                className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: 'white' }}
              >
                ✕
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => coverRef.current?.click()}
            disabled={uploadingCover}
            className="w-full py-8 rounded-xl border-2 border-dashed text-sm transition-colors hover:border-amber-400 disabled:opacity-50"
            style={{ borderColor: '#F4D7D7', color: '#888' }}
          >
            {uploadingCover ? 'Subiendo...' : '+ Subir foto de portada'}
          </button>
        )}
        <input
          ref={coverRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files && uploadCover(e.target.files)}
        />
        {coverMsg && <p className="text-sm" style={msgStyle(coverMsg)}>{coverMsg}</p>}
        <p className="text-xs" style={{ color: '#999' }}>
          Recomendado: imagen horizontal (16:9), mínimo 1200×630 px.
        </p>
      </div>

      {/* Gallery */}
      <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm" style={{ color: '#2D2D2D' }}>
            Galería ({images.length} fotos)
          </h2>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingGallery}
            className="px-4 py-1.5 rounded-xl text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {uploadingGallery ? 'Subiendo...' : '+ Añadir fotos'}
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadGallery(e.target.files)}
        />

        {galleryMsg && <p className="text-sm" style={msgStyle(galleryMsg)}>{galleryMsg}</p>}

        {images.length === 0 ? (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-12 rounded-xl border-2 border-dashed text-sm transition-colors hover:border-amber-400"
            style={{ borderColor: '#F4D7D7', color: '#888' }}
          >
            + Haz clic para subir fotos
          </button>
        ) : (
          <>
            <p className="text-xs" style={{ color: '#999' }}>
              Arrastra para reordenar (escritorio) o usa las flechas ← → (móvil).
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((url, i) => (
                <div
                  key={url}
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={handleDragEnd}
                  className="relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing transition-opacity"
                  style={{
                    opacity: draggingIndex === i ? 0.4 : 1,
                    outline: dragOverIndex === i && draggingIndex !== i ? '2px solid #C9A84C' : undefined,
                  }}
                >
                  <img src={url} className="w-full h-full object-cover pointer-events-none" alt={`Foto ${i + 1}`} />
                  {/* Delete */}
                  <button
                    onClick={() => removeImage(url)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                    title="Eliminar foto"
                  >
                    ✕
                  </button>
                  {/* Reorder arrows */}
                  <div className="absolute bottom-1 left-1 flex gap-0.5">
                    {i > 0 && (
                      <button
                        onClick={() => moveImage(i, 'prev')}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs"
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                        title="Mover a la izquierda"
                      >
                        ←
                      </button>
                    )}
                    {i < images.length - 1 && (
                      <button
                        onClick={() => moveImage(i, 'next')}
                        className="w-6 h-6 rounded flex items-center justify-center text-xs"
                        style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: 'white' }}
                        title="Mover a la derecha"
                      >
                        →
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
