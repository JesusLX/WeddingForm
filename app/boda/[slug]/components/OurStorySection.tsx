import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function OurStorySection({ wedding }: { wedding: Wedding }) {
  if (!wedding.our_story) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--w-bg)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
            Nuestra historia
          </p>
          <h2
            className="text-4xl md:text-5xl mb-8 italic"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
          >
            Cómo empezó todo
          </h2>
          <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: 'var(--w-primary)' }} />
          <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#555555' }}>
            {wedding.our_story}
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
