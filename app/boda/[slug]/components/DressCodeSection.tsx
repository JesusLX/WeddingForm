import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function DressCodeSection({ wedding }: { wedding: Wedding }) {
  if (!wedding.dress_code) return null

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
            Vestimenta
          </p>
          <h2
            className="text-4xl md:text-5xl italic mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
          >
            Código de vestimenta
          </h2>
          <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: '#C9A84C' }} />

          <div
            className="inline-block px-8 py-4 rounded-2xl text-2xl font-semibold mb-6"
            style={{
              backgroundColor: '#F4D7D7',
              color: '#2D2D2D',
              fontFamily: 'var(--font-playfair)',
            }}
          >
            {wedding.dress_code}
          </div>

          {wedding.dress_code_notes && (
            <p className="text-base leading-relaxed" style={{ color: '#555555' }}>
              {wedding.dress_code_notes}
            </p>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
