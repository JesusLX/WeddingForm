import { ScrollReveal } from '@/components/ScrollReveal'
import type { WeddingEvent } from '@/lib/types'

function buildMapsLink(url: string | null, address: string | null): string | null {
  if (url) return url
  if (address) return `https://maps.google.com/?q=${encodeURIComponent(address)}`
  return null
}

export function ExtraEventsSection({ events }: { events: WeddingEvent[] }) {
  if (!events || events.length === 0) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--w-accent)', opacity: 1 }}>
      <div className="max-w-3xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
              Más celebraciones
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              Eventos
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: 'var(--w-primary)' }} />
          </div>
        </ScrollReveal>

        <div className="grid gap-6 md:grid-cols-2">
          {events.map((ev) => {
            const mapsLink = buildMapsLink(ev.maps_url, ev.address)
            const dateStr = new Date(ev.event_date + 'T00:00:00').toLocaleDateString('es-ES', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })
            const timeStr = ev.event_time ? ev.event_time.slice(0, 5) : null

            return (
              <ScrollReveal key={ev.id}>
                <div
                  className="rounded-2xl overflow-hidden shadow-sm"
                  style={{ backgroundColor: 'var(--w-bg)', border: '1px solid var(--w-accent)' }}
                >
                  <div className="p-6 text-center">
                    <p
                      className="uppercase tracking-[0.2em] text-xs mb-2"
                      style={{ color: 'var(--w-primary)' }}
                    >
                      {dateStr}
                    </p>
                    <h3
                      className="text-2xl italic mb-1"
                      style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
                    >
                      {ev.name}
                    </h3>
                    {timeStr && (
                      <p className="text-lg font-semibold mb-2" style={{ color: 'var(--w-dark)' }}>
                        {timeStr}
                      </p>
                    )}
                    {ev.venue && (
                      <p className="text-base font-medium" style={{ color: 'var(--w-dark)' }}>{ev.venue}</p>
                    )}
                    {ev.address && (
                      <p className="text-sm mt-1" style={{ color: '#666' }}>{ev.address}</p>
                    )}
                    {ev.description && (
                      <p className="text-sm mt-3" style={{ color: '#555' }}>{ev.description}</p>
                    )}
                  </div>
                  {mapsLink && (
                    <div
                      className="px-6 py-3 border-t text-center"
                      style={{ borderColor: 'var(--w-accent)' }}
                    >
                      <a
                        href={mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium uppercase tracking-wide"
                        style={{ color: 'var(--w-primary)' }}
                      >
                        Ver en Maps →
                      </a>
                    </div>
                  )}
                </div>
              </ScrollReveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
