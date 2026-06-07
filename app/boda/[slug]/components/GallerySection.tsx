import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function GallerySection({ wedding }: { wedding: Wedding }) {
  if (!wedding.gallery_image_urls || wedding.gallery_image_urls.length === 0) return null

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
              Momentos nuestros
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              Galería
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: 'var(--w-primary)' }} />
          </div>
        </ScrollReveal>

        <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
          {wedding.gallery_image_urls.map((url, i) => (
            <ScrollReveal key={i}>
              <div className="break-inside-avoid rounded-xl overflow-hidden">
                <img
                  src={url}
                  alt={`Foto ${i + 1}`}
                  className="w-full object-cover hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}
