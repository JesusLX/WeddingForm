import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string, locale = 'es-ES') {
  return new Date(dateStr).toLocaleDateString(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(timeStr: string) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  return `${h}:${m}`
}

export function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  return match ? match[1] : null
}

export function buildMapsEmbedUrl(mapsUrl: string): string {
  try {
    const url = new URL(mapsUrl)
    if (url.hostname.includes('google.com') && url.pathname.includes('/maps')) {
      const q = url.searchParams.get('q')
      if (q) return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed`
      // For share links like maps.app.goo.gl or full URLs
      return `https://www.google.com/maps/embed?pb=${url.searchParams.get('pb') ?? ''}`
    }
  } catch {}
  // Fallback: treat as address
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapsUrl)}&output=embed`
}

export function buildMapsDirectionsUrl(mapsUrl: string): string {
  try {
    const url = new URL(mapsUrl)
    if (url.hostname.includes('google.com')) {
      // Embed URLs can't be opened directly — strip /embed and keep the pb param
      if (url.pathname.includes('/embed')) {
        const pb = url.searchParams.get('pb')
        return pb
          ? `https://www.google.com/maps?pb=${pb}`
          : 'https://maps.google.com/maps'
      }
      return mapsUrl
    }
  } catch {}
  return `https://maps.google.com/maps?q=${encodeURIComponent(mapsUrl)}`
}

export function getCountdownParts(targetDate: string) {
  const now = new Date()
  const target = new Date(targetDate)
  const diff = target.getTime() - now.getTime()
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  return { days, hours, minutes, seconds }
}

export function getSpotifyEmbedUrl(playlistUrl: string): string | null {
  try {
    const url = new URL(playlistUrl)
    if (!url.hostname.includes('spotify.com')) return null
    const path = url.pathname // e.g. /playlist/37i9dQZF1DXcBWIGoYBM5M
    return `https://open.spotify.com/embed${path}?utm_source=generator`
  } catch {
    return null
  }
}
