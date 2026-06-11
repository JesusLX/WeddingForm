import { ScrollReveal } from '@/components/ScrollReveal'
import type { GuestPhoto } from '@/lib/types'

export function CollabGallerySection({
  photos,
  slug,
}: {
  photos: GuestPhoto[]
  slug: string
}) {
  if (!photos || photos.length === 0) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--w-bg)' }}>
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
              Recuerdos compartidos
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              Vuestra galería
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: 'var(--w-primary)' }} />
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((photo, i) => (
            <ScrollReveal key={photo.id}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{ aspectRatio: i % 5 === 0 ? '1 / 1.3' : '1', backgroundColor: 'var(--w-accent)' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.photo_url}
                  alt={photo.caption ?? ''}
                  className="w-full h-full object-cover"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="text-center mt-10">
            <a
              href={`/boda/${slug}/fotos`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--w-primary)', color: 'white' }}
            >
              📷 Añade tu foto
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
