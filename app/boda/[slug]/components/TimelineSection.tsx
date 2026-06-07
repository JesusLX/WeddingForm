import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function TimelineSection({ wedding }: { wedding: Wedding }) {
  if (!wedding.event_timeline || wedding.event_timeline.length === 0) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--w-bg)' }}>
      <div className="max-w-xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
              El programa
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              Así será el día
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: 'var(--w-primary)' }} />
          </div>
        </ScrollReveal>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2"
            style={{ background: 'linear-gradient(to bottom, transparent, var(--w-primary) 10%, var(--w-primary) 90%, transparent)' }}
          />

          <div className="flex flex-col gap-8">
            {wedding.event_timeline.map((event, i) => (
              <ScrollReveal key={i}>
                <div className={`flex items-center gap-6 ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  {/* Text */}
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
                    <p className="text-2xl font-semibold" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>
                      {event.time}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#555555' }}>{event.label}</p>
                  </div>

                  {/* Icon or dot */}
                  <div className="relative z-10 flex-shrink-0 flex items-center justify-center w-10 h-10" style={{ backgroundColor: 'var(--w-bg)' }}>
                    {event.icon ? (
                      event.icon.startsWith('http') || event.icon.startsWith('/') || event.icon.startsWith('data:') ? (
                        <div className="w-10 h-10 rounded-full border-2 flex items-center justify-center" style={{ borderColor: 'var(--w-primary)', backgroundColor: 'var(--w-bg)' }}>
                          <img src={event.icon} alt="" className="w-6 h-6 object-contain" />
                        </div>
                      ) : (
                        <span className="text-2xl leading-none">{event.icon}</span>
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: 'var(--w-bg)', borderColor: 'var(--w-primary)' }} />
                    )}
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
