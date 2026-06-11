'use client'

import { useState, useEffect } from 'react'
import type React from 'react'

type Phase = 'idle' | 'burst' | 'revealed'

type Particle = {
  id: number
  tx: number
  ty: number
  size: number
  color: string
  rounded: boolean
  rot: number
  duration: number
  delay: number
}

const COLORS = [
  '#C9A84C', '#FFD700', '#F4D7D7', '#FFC0CB',
  '#E8D5B7', '#ffffff', '#FFB347', '#A8D8EA',
]

function makeParticles(): Particle[] {
  return Array.from({ length: 48 }, (_, i) => {
    const angle = Math.random() * 2 * Math.PI
    const dist  = 90 + Math.random() * 180
    return {
      id:       i,
      tx:       Math.cos(angle) * dist,
      ty:       Math.sin(angle) * dist,
      size:     5 + Math.random() * 12,
      color:    COLORS[Math.floor(Math.random() * COLORS.length)],
      rounded:  Math.random() > 0.35,
      rot:      Math.random() * 360,
      duration: 0.45 + Math.random() * 0.6,
      delay:    Math.random() * 0.2,
    }
  })
}

function EnvelopeSvg() {
  return (
    <svg
      viewBox="0 0 200 140"
      style={{ width: 220, height: 154, filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.22))' }}
    >
      <rect x="1" y="1" width="198" height="138" rx="8" fill="#FAF3E8" />
      <polygon points="1,1 100,80 1,139"   fill="#EDE3CE" />
      <polygon points="199,1 100,80 199,139" fill="#E5D8BE" />
      <polygon points="1,139 100,74 199,139" fill="#F2E9D6" />
      <polygon points="1,1 100,74 199,1"    fill="#E8DCC8" />
      <rect x="1" y="1" width="198" height="138" rx="8" fill="none" stroke="#C9A84C" strokeWidth="1.5" opacity="0.55" />
      <circle cx="100" cy="70" r="26" fill="#C9A84C" />
      <circle cx="100" cy="70" r="23" fill="none" stroke="#B8942A" strokeWidth="1" opacity="0.5" />
      <text x="100" y="77" textAnchor="middle" fontSize="19" fill="white" fontFamily="serif">✦</text>
    </svg>
  )
}

type EventData = {
  name: string
  event_date: string
  event_time: string | null
  venue: string | null
  address: string | null
  maps_url: string | null
  description: string | null
}

export function EnvelopeReveal({
  event,
  weddingNames,
  weddingYear,
}: {
  event: EventData
  weddingNames: string
  weddingYear: number
}) {
  const [phase, setPhase]       = useState<Phase>('idle')
  const [shaking, setShaking]   = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    if (phase !== 'idle') return
    const t = setInterval(() => {
      setShaking(true)
      setTimeout(() => setShaking(false), 800)
    }, 3500)
    return () => clearInterval(t)
  }, [phase])

  function open() {
    if (phase !== 'idle') return
    setParticles(makeParticles())
    setPhase('burst')
    setTimeout(() => setPhase('revealed'), 900)
  }

  const dateStr = new Date(event.event_date + 'T00:00:00').toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = event.event_time ? event.event_time.slice(0, 5) : null
  const mapsHref = event.maps_url
    ? event.maps_url
    : event.address
      ? `https://maps.google.com/?q=${encodeURIComponent(event.address)}`
      : null

  return (
    <>
      <style>{`
        @keyframes env-shake {
          0%,100% { transform: rotate(0deg) scale(1); }
          10%     { transform: rotate(-9deg) scale(1.07); }
          22%     { transform: rotate(9deg)  scale(1.08); }
          34%     { transform: rotate(-6deg) scale(1.05); }
          46%     { transform: rotate(6deg)  scale(1.05); }
          58%     { transform: rotate(-3deg) scale(1.02); }
          70%     { transform: rotate(3deg)  scale(1.02); }
          84%     { transform: rotate(-1deg) scale(1.01); }
        }
        @keyframes env-pop {
          0%   { transform: scale(1);   opacity: 1; }
          35%  { transform: scale(1.6); opacity: 1; filter: brightness(2); }
          100% { transform: scale(0.1); opacity: 0; }
        }
        @keyframes chiribita {
          0%   { transform: translate(-50%,-50%) scale(1.5) rotate(var(--r)); opacity: 1; }
          100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.05) rotate(calc(var(--r) + 200deg)); opacity: 0; }
        }
        @keyframes card-in {
          from { transform: translateY(36px) scale(0.93); opacity: 0; }
          to   { transform: translateY(0)    scale(1);    opacity: 1; }
        }
        @keyframes hint-pulse {
          0%,100% { opacity: 0.4; }
          50%     { opacity: 0.9; }
        }
      `}</style>

      {phase !== 'revealed' && (
        <div
          className="relative flex flex-col items-center justify-center"
          style={{ minHeight: '100vh' }}
        >
          {particles.map(p => (
            <div
              key={p.id}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: p.size,
                height: p.size,
                borderRadius: p.rounded ? '50%' : '2px',
                backgroundColor: p.color,
                '--tx': `${p.tx}px`,
                '--ty': `${p.ty}px`,
                '--r':  `${p.rot}deg`,
                animation: `chiribita ${p.duration}s ${p.delay}s cubic-bezier(0.15,0.85,0.35,1) forwards`,
                pointerEvents: 'none',
              } as React.CSSProperties}
            />
          ))}

          <button
            onClick={open}
            disabled={phase !== 'idle'}
            aria-label="Abrir invitación"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: phase === 'idle' ? 'pointer' : 'default',
              animation: phase === 'burst'
                ? 'env-pop 0.65s cubic-bezier(0.4,0,0.2,1) forwards'
                : shaking
                  ? 'env-shake 0.8s ease-in-out'
                  : 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <EnvelopeSvg />
          </button>

          {phase === 'idle' && (
            <p
              className="mt-8 text-sm tracking-wide text-center"
              style={{ animation: 'hint-pulse 2.4s ease-in-out infinite', color: 'var(--w-primary)' }}
            >
              Pulsa el sobre para abrir tu invitación
            </p>
          )}
        </div>
      )}

      {phase === 'revealed' && (
        <div
          className="w-full max-w-lg text-center px-6 py-20 mx-auto"
          style={{ animation: 'card-in 0.75s cubic-bezier(0.2,0.85,0.4,1) forwards' }}
        >
          <p
            className="uppercase tracking-[0.3em] text-xs mb-6"
            style={{ color: 'var(--w-primary)', opacity: 0.65 }}
          >
            {weddingNames}
          </p>

          <h1
            className="text-4xl md:text-5xl italic mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
          >
            {event.name}
          </h1>

          <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: 'var(--w-primary)' }} />

          <div className="space-y-2 mb-8">
            <p className="text-lg capitalize" style={{ color: 'var(--w-dark)' }}>
              {dateStr}
            </p>
            {timeStr && (
              <p className="text-2xl font-semibold" style={{ color: 'var(--w-primary)' }}>
                {timeStr}
              </p>
            )}
          </div>

          {(event.venue || event.address) && (
            <div
              className="rounded-2xl px-6 py-5 mb-6 text-left max-w-sm mx-auto"
              style={{ backgroundColor: 'var(--w-accent)' }}
            >
              {event.venue && (
                <p className="font-semibold text-base mb-1" style={{ color: 'var(--w-dark)' }}>
                  {event.venue}
                </p>
              )}
              {event.address && (
                <p className="text-sm" style={{ color: '#666' }}>
                  {event.address}
                </p>
              )}
            </div>
          )}

          {event.description && (
            <p className="text-sm leading-relaxed mb-8" style={{ color: '#555' }}>
              {event.description}
            </p>
          )}

          {mapsHref && (
            <a
              href={mapsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'var(--w-primary)', color: '#fff' }}
            >
              Ver en Maps →
            </a>
          )}

          <p className="mt-20 text-xs" style={{ color: 'var(--w-primary)', opacity: 0.35 }}>
            {weddingNames} · {weddingYear}
          </p>
        </div>
      )}
    </>
  )
}
