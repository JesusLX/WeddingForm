import { ScrollReveal } from '@/components/ScrollReveal'
import { getSpotifyEmbedUrl } from '@/lib/utils'
import type { Wedding } from '@/lib/types'

export function SpotifySection({ wedding }: { wedding: Wedding }) {
  if (!wedding.spotify_playlist_url) return null
  const embedUrl = getSpotifyEmbedUrl(wedding.spotify_playlist_url)
  if (!embedUrl) return null

  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
            Nuestra playlist
          </p>
          <h2
            className="text-4xl md:text-5xl italic mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
          >
            La música del día
          </h2>
          <div className="h-px w-16 mx-auto mb-10" style={{ backgroundColor: '#C9A84C' }} />

          <iframe
            src={embedUrl}
            width="100%"
            height="380"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            className="rounded-2xl shadow-sm"
            title="Playlist de la boda"
          />

          <p className="mt-6 text-sm" style={{ color: '#555555' }}>
            ¿Se te ocurre una canción que no puede faltar?{' '}
            <span className="font-medium" style={{ color: '#C9A84C' }}>
              Dínoslo en la confirmación ↓
            </span>
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
