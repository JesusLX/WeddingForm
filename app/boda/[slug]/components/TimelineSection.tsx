import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function TimelineSection({ wedding }: { wedding: Wedding }) {
  if (!wedding.event_timeline || wedding.event_timeline.length === 0) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#F9EEE8' }}>
      <div className="max-w-xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
              El programa
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
            >
              Así será el día
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom, transparent, #C9A84C 10%, #C9A84C 90%, transparent)' }}
          />

          <div className="flex flex-col gap-8">
            {wedding.event_timeline.map((event, i) => (
              <ScrollReveal key={i}>
                <div className={`flex items-center gap-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Text */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
                      {event.time}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#555555' }}>{event.label}</p>
                  </div>

                  {/* Dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className="w-4 h-4 rounded-full border-2"
                      style={{ backgroundColor: '#FAF7F4', borderColor: '#C9A84C' }}
                    />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
