'use client'
import { useState, useEffect } from 'react'
import type React from 'react'
import { gridDim, type BingoCellType, type BingoStatus } from '@/lib/bingo'

type Session = { playerId: string; name: string; card: (string | null)[] }

const CONFETTI_COLORS = ['#C9A84C', '#FFD700', '#F4D7D7', '#FFC0CB', '#E8D5B7', '#ffffff', '#FFB347', '#A8D8EA']

type Spark = { id: number; tx: number; ty: number; size: number; color: string; rounded: boolean; rot: number; dur: number }

function makeSparks(count: number, spread: number): Spark[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * 2 * Math.PI
    const dist = spread * (0.4 + Math.random() * 0.6)
    return {
      id: Date.now() + i,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist,
      size: 5 + Math.random() * 9,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      rounded: Math.random() > 0.4,
      rot: Math.random() * 360,
      dur: 0.5 + Math.random() * 0.5,
    }
  })
}

export function BingoHub({
  accessKey, cellType, cardSize, weddingNames,
}: {
  accessKey: string
  cellType: BingoCellType
  cardSize: number
  weddingNames: string
}) {
  const storageKey = `bingo:${accessKey}`
  const [session, setSession] = useState<Session | null>(null)
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')

  const [drawn, setDrawn] = useState<string[]>([])
  const [status, setStatus] = useState<BingoStatus>('lobby')
  const [marked, setMarked] = useState<number[]>([])
  const [hasLine, setHasLine] = useState(false)
  const [hasBingo, setHasBingo] = useState(false)

  const [confetti, setConfetti] = useState<Spark[]>([])
  const [cellSparks, setCellSparks] = useState<Record<number, Spark[]>>({})
  const [shake, setShake] = useState<number | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  const dim = gridDim(cardSize)
  const drawnSet = new Set(drawn)

  // Restore session from localStorage after mount (reading storage is a
  // client-only side effect; setState here is the idiomatic pattern).
  useEffect(() => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
    try {
      const s = JSON.parse(raw) as Session
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (s.playerId && Array.isArray(s.card)) setSession(s)
    } catch {}
  }, [storageKey])

  // Poll game state once joined
  useEffect(() => {
    if (!session) return
    let active = true
    async function run() {
      const res = await fetch(`/api/bingo/state?access_key=${accessKey}`)
      if (!res.ok || !active) return
      const json = await res.json()
      if (!active) return
      setDrawn(json.drawn ?? [])
      setStatus(json.status)
    }
    run()
    const t = setInterval(run, 2500)
    return () => { active = false; clearInterval(t) }
  }, [session, accessKey])

  async function join() {
    if (!name.trim()) return
    setJoining(true); setError('')
    const res = await fetch('/api/bingo/join', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_key: accessKey, name: name.trim() }),
    })
    const json = await res.json()
    setJoining(false)
    if (!res.ok || json.error) { setError(json.error ?? 'No se pudo unir'); return }
    const s: Session = { playerId: json.player_id, name: json.name, card: json.card }
    localStorage.setItem(storageKey, JSON.stringify(s))
    setSession(s)
    setDrawn(json.game?.drawn ?? [])
    setStatus(json.game?.status ?? 'lobby')
  }

  async function tapCell(index: number) {
    if (!session || status !== 'playing') return
    const value = session.card[index]
    if (value === null) return  // blank cell on Spanish card
    if (!marked.includes(index) && !drawnSet.has(value)) {
      // Not drawn yet — reject with a shake
      setShake(index)
      setTimeout(() => setShake(null), 400)
      return
    }
    const res = await fetch('/api/bingo/mark', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ player_id: session.playerId, index }),
    })
    const json = await res.json()
    if (json.rejected) { setShake(index); setTimeout(() => setShake(null), 400); return }
    if (json.error) return
    setMarked(json.marked ?? [])

    // Chiribitas on the tapped cell when it became marked
    if ((json.marked ?? []).includes(index)) {
      const sparks = makeSparks(12, 60)
      setCellSparks(prev => ({ ...prev, [index]: sparks }))
      setTimeout(() => setCellSparks(prev => { const n = { ...prev }; delete n[index]; return n }), 900)
    }

    if (json.has_line && !hasLine) setHasLine(true)
    if (json.has_bingo && !hasBingo) setHasBingo(true)

    if (json.claim === 'bingo') celebrate('¡BINGO! 🏆')
    else if (json.claim === 'line') celebrate('¡LÍNEA! ✨')
  }

  function celebrate(text: string) {
    setBanner(text)
    setConfetti(makeSparks(70, 320))
    setTimeout(() => setConfetti([]), 1600)
    setTimeout(() => setBanner(null), 3500)
  }

  const keyframes = `
    @keyframes spark-fly { 0% { transform: translate(-50%,-50%) scale(1.2) rotate(var(--r)); opacity:1 } 100% { transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.1) rotate(calc(var(--r) + 220deg)); opacity:0 } }
    @keyframes cell-shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-4px)} 75%{transform:translateX(4px)} }
    @keyframes banner-in { from{transform:translateY(-20px) scale(0.9);opacity:0} to{transform:translateY(0) scale(1);opacity:1} }
    @keyframes pop-in { from{transform:scale(0.96);opacity:0} to{transform:scale(1);opacity:1} }
  `

  // ---------- NAME ENTRY ----------
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <style>{keyframes}</style>
        <p className="uppercase tracking-[0.28em] text-xs font-medium mb-2" style={{ color: 'var(--w-primary)' }}>{weddingNames}</p>
        <h1 className="text-4xl italic mb-2" style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}>Bingo</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--w-dark)', opacity: 0.6 }}>Escribe tu nombre para conseguir tu cartón</p>
        <div className="w-full max-w-xs space-y-3">
          <input value={name} onChange={e => setName(e.target.value)} maxLength={60}
            placeholder="Tu nombre" onKeyDown={e => e.key === 'Enter' && join()}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none text-center"
            style={{ borderColor: 'var(--w-accent)', backgroundColor: 'white', color: 'var(--w-dark)' }} />
          {error && <p className="text-sm" style={{ color: '#EF5350' }}>{error}</p>}
          <button onClick={join} disabled={joining || !name.trim()}
            className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
            style={{ backgroundColor: 'var(--w-primary)' }}>
            {joining ? 'Entrando...' : 'Entrar a jugar'}
          </button>
        </div>
      </div>
    )
  }

  // ---------- BOARD ----------
  return (
    <div className="min-h-screen px-4 py-8 relative overflow-hidden">
      <style>{keyframes}</style>

      {/* Confetti */}
      {confetti.map(s => (
        <div key={s.id} style={{
          position: 'fixed', left: '50%', top: '40%', width: s.size, height: s.size,
          borderRadius: s.rounded ? '50%' : '2px', backgroundColor: s.color, zIndex: 60, pointerEvents: 'none',
          '--tx': `${s.tx}px`, '--ty': `${s.ty}px`, '--r': `${s.rot}deg`,
          animation: `spark-fly ${s.dur}s cubic-bezier(0.15,0.85,0.35,1) forwards`,
        } as React.CSSProperties} />
      ))}

      {/* Win banner */}
      {banner && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[70] px-6 py-3 rounded-full text-white font-bold text-lg shadow-lg"
          style={{ backgroundColor: 'var(--w-primary)', animation: 'banner-in 0.4s ease-out' }}>
          {banner}
        </div>
      )}

      <div className="max-w-sm mx-auto text-center">
        <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--w-primary)' }}>{session.name}</p>

        {/* Status line */}
        {status === 'lobby' && <p className="text-sm mb-4" style={{ color: 'var(--w-dark)', opacity: 0.6 }}>Espera a que empiece la partida…</p>}
        {status === 'paused' && <p className="text-sm mb-4 font-medium" style={{ color: 'var(--w-primary)' }}>⏸ Juego en pausa</p>}
        {status === 'finished' && <p className="text-sm mb-4 font-medium" style={{ color: 'var(--w-dark)' }}>La partida ha terminado</p>}
        {status === 'playing' && (
          <p className="text-sm mb-4" style={{ color: 'var(--w-dark)', opacity: 0.6 }}>
            {drawn.length > 0 ? 'Toca las casillas que vayan saliendo' : 'Esperando el primer número…'}
          </p>
        )}

        {/* Last drawn */}
        {status !== 'lobby' && drawn.length > 0 && (
          <div className="mb-5">
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--w-dark)', opacity: 0.4 }}>Último</p>
            {cellType === 'photos'
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={drawn[drawn.length - 1]} alt="" className="w-20 h-20 object-cover rounded-2xl mx-auto" style={{ animation: 'pop-in 0.3s' }} />
              : <span className="text-5xl font-bold" style={{ color: 'var(--w-primary)', fontFamily: 'var(--font-playfair)', animation: 'pop-in 0.3s' }}>{drawn[drawn.length - 1]}</span>}
          </div>
        )}

        {/* Card — Spanish 3×9 for numbers, square grid for emojis/photos */}
        {cellType === 'numbers' ? (
          <div className="space-y-1.5 mx-auto w-full" style={{ maxWidth: 380 }}>
            {[0, 1, 2].map(row => (
              <div key={row} className="grid gap-1" style={{ gridTemplateColumns: 'repeat(9, 1fr)' }}>
                {Array.from({ length: 9 }, (_, col) => {
                  const i = row * 9 + col
                  const value = session.card[i]
                  if (value === null) {
                    return <div key={col} className="aspect-square rounded-md" style={{ backgroundColor: 'rgba(0,0,0,0.05)' }} />
                  }
                  const isMarked = marked.includes(i)
                  const isDrawable = drawnSet.has(value) && !isMarked && status === 'playing'
                  return (
                    <button
                      key={col}
                      onClick={() => tapCell(i)}
                      className="relative aspect-square rounded-md flex items-center justify-center font-semibold transition-all overflow-visible"
                      style={{
                        backgroundColor: isMarked ? 'var(--w-primary)' : 'white',
                        color: isMarked ? 'white' : 'var(--w-dark)',
                        border: `1.5px solid ${isMarked ? 'var(--w-primary)' : isDrawable ? 'var(--w-primary)' : 'var(--w-accent)'}`,
                        boxShadow: isDrawable ? '0 0 0 2px color-mix(in srgb, var(--w-primary) 30%, transparent)' : 'none',
                        animation: shake === i ? 'cell-shake 0.4s' : undefined,
                        fontSize: 'clamp(9px, 2.2vw, 14px)',
                      }}
                    >
                      {value}
                      {(cellSparks[i] ?? []).map(s => (
                        <span key={s.id} style={{
                          position: 'absolute', left: '50%', top: '50%', width: s.size, height: s.size,
                          borderRadius: s.rounded ? '50%' : '2px', backgroundColor: s.color, pointerEvents: 'none', zIndex: 40,
                          '--tx': `${s.tx}px`, '--ty': `${s.ty}px`, '--r': `${s.rot}deg`,
                          animation: `spark-fly ${s.dur}s cubic-bezier(0.15,0.85,0.35,1) forwards`,
                        } as React.CSSProperties} />
                      ))}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${dim}, 1fr)`, maxWidth: dim * 92 }}>
            {session.card.map((value, i) => {
              const isMarked = marked.includes(i)
              const isDrawable = value !== null && drawnSet.has(value) && !isMarked && status === 'playing'
              return (
                <button
                  key={i}
                  onClick={() => tapCell(i)}
                  className="relative aspect-square rounded-xl flex items-center justify-center font-semibold transition-all overflow-visible"
                  style={{
                    backgroundColor: isMarked ? 'var(--w-primary)' : 'white',
                    color: isMarked ? 'white' : 'var(--w-dark)',
                    border: `2px solid ${isMarked ? 'var(--w-primary)' : isDrawable ? 'var(--w-primary)' : 'var(--w-accent)'}`,
                    boxShadow: isDrawable ? '0 0 0 3px color-mix(in srgb, var(--w-primary) 30%, transparent)' : 'none',
                    animation: shake === i ? 'cell-shake 0.4s' : undefined,
                    fontSize: cellType === 'emojis' ? '1.6rem' : '1.1rem',
                  }}
                >
                  {cellType === 'photos'
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={value ?? ''} alt="" className="absolute inset-0 w-full h-full object-cover rounded-[10px]" style={{ opacity: isMarked ? 0.45 : 1 }} />
                    : value}
                  {isMarked && cellType === 'photos' && <span className="relative text-white text-2xl">✓</span>}

                  {(cellSparks[i] ?? []).map(s => (
                    <span key={s.id} style={{
                      position: 'absolute', left: '50%', top: '50%', width: s.size, height: s.size,
                      borderRadius: s.rounded ? '50%' : '2px', backgroundColor: s.color, pointerEvents: 'none', zIndex: 40,
                      '--tx': `${s.tx}px`, '--ty': `${s.ty}px`, '--r': `${s.rot}deg`,
                      animation: `spark-fly ${s.dur}s cubic-bezier(0.15,0.85,0.35,1) forwards`,
                    } as React.CSSProperties} />
                  ))}
                </button>
              )
            })}
          </div>
        )}

        {/* Achievement */}
        {(hasLine || hasBingo) && (
          <p className="mt-5 text-sm font-medium" style={{ color: 'var(--w-primary)' }}>
            {hasBingo ? '🏆 ¡Has hecho bingo!' : '✨ ¡Has hecho línea!'}
          </p>
        )}
      </div>
    </div>
  )
}
