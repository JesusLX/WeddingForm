import { ScrollReveal } from '@/components/ScrollReveal'
import { formatTime, buildMapsEmbedUrl, buildMapsDirectionsUrl } from '@/lib/utils'
import type { Wedding } from '@/lib/types'

function VenueCard({
  title,
  time,
  venue,
  address,
  mapsUrl,
}: {
  title: string
  time: string | null
  venue: string | null
  address: string | null
  mapsUrl: string | null
}) {
  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-sm border border-rose-100">
      <div className="p-8 text-center" style={{ backgroundColor: '#FAF7F4' }}>
        <p className="uppercase tracking-[0.25em] text-xs mb-2" style={{ color: '#C9A84C' }}>{title}</p>
        {time && (
          <p className="text-3xl font-semibold mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
            {formatTime(time)}
          </p>
        )}
        {venue && (
          <p className="text-lg font-medium mb-1" style={{ color: '#2D2D2D' }}>{venue}</p>
        )}
        {address && (
          <p className="text-sm" style={{ color: '#555555' }}>{address}</p>
        )}
        {mapsUrl && (
          <a
            href={buildMapsDirectionsUrl(mapsUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#C9A84C', color: 'white' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Cómo llegar
          </a>
        )}
      </div>

      {mapsUrl && (
        <div className="h-56 w-full">
          <iframe
            src={buildMapsEmbedUrl(mapsUrl)}
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa: ${venue ?? title}`}
          />
        </div>
      )}
    </div>
  )
}

export function EventDetailsSection({ wedding }: { wedding: Wedding }) {
  const hasCeremony = wedding.ceremony_venue || wedding.ceremony_address
  const hasReception = !wedding.same_venue && (wedding.reception_venue || wedding.reception_address)

  if (!hasCeremony && !hasReception) return null

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
              El gran día
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
            >
              Dónde y cuándo
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </ScrollReveal>

        <div className={`grid gap-8 ${hasReception ? 'md:grid-cols-2' : 'max-w-lg mx-auto'}`}>
          {hasCeremony && (
            <ScrollReveal>
              <VenueCard
                title="Ceremonia"
                time={wedding.ceremony_time}
                venue={wedding.ceremony_venue}
                address={wedding.ceremony_address}
                mapsUrl={wedding.ceremony_maps_url}
              />
            </ScrollReveal>
          )}
          {hasReception && (
            <ScrollReveal>
              <VenueCard
                title="Convite"
                time={wedding.reception_time}
                venue={wedding.reception_venue}
                address={wedding.reception_address}
                mapsUrl={wedding.reception_maps_url}
              />
            </ScrollReveal>
          )}
        </div>
      </div>
    </section>
  )
}
