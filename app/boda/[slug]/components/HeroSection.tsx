import { formatDate } from '@/lib/utils'
import { CountdownTimer } from './CountdownTimer'
import type { Wedding } from '@/lib/types'

export function HeroSection({ wedding }: { wedding: Wedding }) {
  const dateLabel = formatDate(wedding.wedding_date)

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      {wedding.cover_image_url ? (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${wedding.cover_image_url})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-rose-200 via-pink-100 to-amber-100" />
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        <p
          className="text-white/80 uppercase tracking-[0.3em] text-sm mb-4 animate-fade-in-up"
          style={{ animationDelay: '0.1s', opacity: 0 }}
        >
          Nos casamos
        </p>
        <h1
          className="text-5xl md:text-7xl lg:text-8xl text-white mb-4 leading-tight animate-fade-in-up"
          style={{ fontFamily: 'var(--font-playfair)', animationDelay: '0.25s', opacity: 0 }}
        >
          {wedding.partner_1}
          <span className="block text-3xl md:text-4xl text-white/70 my-2">&</span>
          {wedding.partner_2}
        </h1>

        <div
          className="flex items-center justify-center gap-3 mb-8 animate-fade-in-up"
          style={{ animationDelay: '0.4s', opacity: 0 }}
        >
          <div className="h-px w-12 bg-white/40" />
          <p className="text-white/90 text-sm md:text-base capitalize">{dateLabel}</p>
          <div className="h-px w-12 bg-white/40" />
        </div>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          <CountdownTimer targetDate={wedding.wedding_date} />
        </div>

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce animate-fade-in-up"
          style={{ animationDelay: '1s', opacity: 0 }}
        >
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}
