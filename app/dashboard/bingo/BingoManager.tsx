'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import type { BingoGame } from '@/lib/types'
import { UI, cardClass, cardStyle, inputClass, inputStyle, primaryButtonClass, primaryButtonStyle } from '@/lib/ui'
import { buildPool, minPoolFor, type BingoCellType } from '@/lib/bingo'

type Player = { id: string; name: string; has_line: boolean; has_bingo: boolean; marked_count: number }
type Reaction = { id: string; emoji: string; sent_at: number }
type FloatingEmoji = { id: string; emoji: string; x: number }

const SIZE_LABELS: Record<number, string> = { 9: '3 × 3', 16: '4 × 4', 25: '5 × 5' }
const CELL_LABELS: Record<BingoCellType, string> = { numbers: 'Números', emojis: 'Emojis', photos: 'Fotos' }

export function BingoManager({ initialGame, weddingSlug }: { initialGame: BingoGame; weddingSlug: string }) {
  const supabase = createClient()
  const [game, setGame] = useState<BingoGame>(initialGame)
  const [players, setPlayers] = useState<Player[]>([])
  const [emojiInput, setEmojiInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [drawing, setDrawing] = useState(false)
  const drawingRef = useRef(false)
  const [floatingEmojis, setFloatingEmojis] = useState<FloatingEmoji[]>([])
  const seenReactionIds = useRef(new Set<string>())

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/boda/${weddingSlug}/bingo` : `/boda/${weddingSlug}/bingo`
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(joinUrl)}`

  const pool = (game.fast_mode && (game.fast_pool ?? []).length > 0)
    ? game.fast_pool
    : buildPool(game.cell_type, game.items ?? [], game.number_max)
  const poolEnough = game.cell_type === 'numbers' || pool.length >= minPoolFor(game.card_size)
  const isLive = game.status === 'playing' || game.status === 'paused'

  function flash(m: string) { setMsg(m); setTimeout(() => setMsg(''), 2500) }

  // ---- Config persistence (owner RLS allows direct updates) ----
  const saveConfig = useCallback(async (patch: Partial<BingoGame>) => {
    setGame(g => ({ ...g, ...patch }))
    const { error } = await supabase.from('bingo_games').update(patch).eq('id', initialGame.id)
    if (error) flash('Error al guardar')
  }, [supabase, initialGame.id])

  // ---- Live control via API (draw needs server-side randomness) ----
  const control = useCallback(async (action: string) => {
    const res = await fetch('/api/bingo/control', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json()
    if (json.game) setGame(g => ({ ...g, ...json.game }))
    if (json.exhausted) flash('Ya han salido todos')
    return json
  }, [])

  // ---- Poll players + game state while live or in lobby ----
  useEffect(() => {
    if (game.status === 'finished') return
    let active = true
    async function poll() {
      const res = await fetch('/api/bingo/players')
      if (!res.ok || !active) return
      const json = await res.json()
      if (!active) return
      if (json.game) setGame(g => ({ ...g, ...json.game }))
      if (json.players) setPlayers(json.players)

      // Floating emoji reactions
      const now = Date.now()
      const fresh = ((json.game?.reactions ?? []) as Reaction[])
        .filter(r => !seenReactionIds.current.has(r.id) && now - r.sent_at < 6000)
      for (const r of fresh) seenReactionIds.current.add(r.id)
      if (fresh.length > 0) {
        setFloatingEmojis(prev => {
          const added: FloatingEmoji[] = fresh.map(r => ({ id: r.id, emoji: r.emoji, x: Math.random() * 70 + 15 }))
          return [...prev, ...added].slice(-15)
        })
        for (const r of fresh) {
          const id = r.id
          setTimeout(() => setFloatingEmojis(prev => prev.filter(e => e.id !== id)), 3200)
        }
      }
    }
    poll()
    const t = setInterval(poll, 2500)
    return () => { active = false; clearInterval(t) }
  }, [game.status])

  // ---- Draw with lock (prevents double-draw on fast taps or slow network) ----
  const draw = useCallback(async () => {
    if (drawingRef.current) return
    drawingRef.current = true
    setDrawing(true)
    try {
      await control('draw')
    } finally {
      drawingRef.current = false
      setDrawing(false)
    }
  }, [control])

  // ---- Auto draw ----
  useEffect(() => {
    if (game.mode !== 'auto' || game.status !== 'playing' || game.pending_claim) return
    const ms = Math.max(2, game.auto_interval) * 1000
    const t = setInterval(() => { draw() }, ms)
    return () => clearInterval(t)
  }, [game.mode, game.status, game.pending_claim, game.auto_interval, draw])

  async function uploadPhoto(file: File) {
    setUploading(true)
    const body = new FormData()
    body.append('file', file)
    const res = await fetch('/api/bingo/photo', { method: 'POST', body })
    const json = await res.json()
    setUploading(false)
    if (json.items) setGame(g => ({ ...g, items: json.items }))
    else flash(json.error ?? 'Error al subir')
  }

  function removeItem(idx: number) {
    saveConfig({ items: (game.items ?? []).filter((_, i) => i !== idx) })
  }

  const lastDrawn = (game.drawn ?? [])[game.drawn.length - 1]

  // ============================================================
  // LIVE MASTER PANEL (playing / paused / finished)
  // ============================================================
  if (isLive || game.status === 'finished') {
    return (
      <div className="space-y-4">
        <style>{`@keyframes float-emoji { 0%{transform:translateY(0) scale(1.1);opacity:0.85} 80%{opacity:0.5} 100%{transform:translateY(-230px) scale(0.7);opacity:0} }`}</style>
        {floatingEmojis.map(fe => (
          <div key={fe.id} style={{
            position: 'fixed', left: `${fe.x}%`, bottom: '28%',
            fontSize: '2.2rem', pointerEvents: 'none', zIndex: 55,
            animation: 'float-emoji 3.2s ease-out forwards',
          }}>{fe.emoji}</div>
        ))}
        {/* Pending claim banner */}
        {game.pending_claim && (
          <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: '#FFF6E0', border: `2px solid ${UI.primary}` }}>
            <p className="text-lg font-semibold" style={{ color: UI.dark }}>
              🎉 {game.pending_claim.name} ha cantado {game.pending_claim.type === 'bingo' ? 'BINGO' : 'LÍNEA'}
            </p>
            <p className="text-sm mt-1 mb-4" style={{ color: UI.text }}>El juego está en pausa. ¿Qué quieres hacer?</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => control('continue')} className={primaryButtonClass} style={primaryButtonStyle}>
                Continuar partida
              </button>
              <button onClick={() => control('end')} className="px-4 py-2.5 rounded-xl text-sm font-medium text-white" style={{ backgroundColor: UI.error }}>
                Terminar
              </button>
            </div>
          </div>
        )}

        {/* Current number */}
        {game.status !== 'finished' && (
          <div className={cardClass} style={cardStyle}>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: UI.muted }}>Último en salir</p>
            <div className="flex items-center justify-center py-4">
              {lastDrawn ? (
                game.cell_type === 'photos'
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={lastDrawn} alt="" className="w-28 h-28 object-cover rounded-2xl" />
                  : <span className="text-6xl font-bold" style={{ color: UI.primary, fontFamily: 'var(--font-playfair)' }}>{lastDrawn}</span>
              ) : (
                <span className="text-sm" style={{ color: UI.muted }}>Aún no ha salido nada</span>
              )}
            </div>
            <p className="text-center text-xs" style={{ color: UI.muted }}>
              {game.drawn.length} de {pool.length} · {players.length} jugando
            </p>

            {/* Controls */}
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {!game.pending_claim && (
                <button
                  onClick={draw}
                  disabled={game.status === 'paused' || drawing}
                  className={primaryButtonClass}
                  style={{ ...primaryButtonStyle, opacity: (game.status === 'paused' || drawing) ? 0.5 : 1 }}
                >
                  {drawing ? 'Sacando…' : 'Sacar siguiente'}
                </button>
              )}
              <button
                onClick={() => saveConfig({ mode: game.mode === 'auto' ? 'manual' : 'auto' })}
                className="px-4 py-2.5 rounded-xl text-sm font-medium"
                style={{ backgroundColor: game.mode === 'auto' ? UI.primary : '#fff', color: game.mode === 'auto' ? '#fff' : UI.primary, border: `1px solid ${UI.primary}` }}
              >
                {game.mode === 'auto' ? `Auto (${game.auto_interval}s) ✓` : 'Modo automático'}
              </button>
              {game.status === 'playing' && !game.pending_claim ? (
                <button onClick={() => control('pause')} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: UI.text, border: '1px solid #ddd' }}>
                  Pausar
                </button>
              ) : game.status === 'paused' && !game.pending_claim ? (
                <button onClick={() => control('continue')} className="px-4 py-2.5 rounded-xl text-sm" style={{ color: UI.text, border: '1px solid #ddd' }}>
                  Reanudar
                </button>
              ) : null}
              <button onClick={() => control('end')} className="px-4 py-2.5 rounded-xl text-sm font-medium" style={{ color: UI.error, border: `1px solid ${UI.error}` }}>
                Terminar
              </button>
            </div>
          </div>
        )}

        {game.status === 'finished' && (
          <div className={cardClass} style={cardStyle}>
            <p className="text-center text-lg font-semibold" style={{ color: UI.dark }}>Partida terminada</p>
            <p className="text-center text-sm mt-1 mb-4" style={{ color: UI.text }}>
              {players.filter(p => p.has_bingo).length} bingos · {players.filter(p => p.has_line).length} líneas
            </p>
            <div className="flex justify-center">
              <button onClick={() => control('reset')} className={primaryButtonClass} style={primaryButtonStyle}>
                Reiniciar para jugar otra vez
              </button>
            </div>
          </div>
        )}

        {/* Drawn history */}
        {game.drawn.length > 0 && game.cell_type !== 'photos' && (
          <div className={cardClass} style={cardStyle}>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: UI.muted }}>Han salido</p>
            <div className="flex flex-wrap gap-1.5">
              {game.drawn.map((d, i) => (
                <span key={i} className="px-2 py-1 rounded-lg text-sm" style={{ backgroundColor: UI.bg, color: UI.dark }}>{d}</span>
              ))}
            </div>
          </div>
        )}

        {/* Players */}
        <div className={cardClass} style={cardStyle}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: UI.muted }}>Jugadores ({players.length})</p>
          {players.length === 0 ? (
            <p className="text-sm" style={{ color: UI.muted }}>Nadie todavía</p>
          ) : (
            <ul className="space-y-1">
              {players.map(p => (
                <li key={p.id} className="flex items-center justify-between text-sm py-1" style={{ color: UI.dark }}>
                  <span>{p.name}</span>
                  <span className="flex gap-1">
                    {p.has_bingo && <span title="Bingo">🏆</span>}
                    {p.has_line && !p.has_bingo && <span title="Línea">✨</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {msg && <p className="text-sm text-center" style={{ color: msg.startsWith('Error') ? UI.error : UI.success }}>{msg}</p>}
      </div>
    )
  }

  // ============================================================
  // CONFIG + LOBBY (status === 'lobby')
  // ============================================================
  return (
    <div className="space-y-4">
      {/* Enable */}
      <div className={cardClass} style={cardStyle}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={game.enabled} onChange={e => saveConfig({ enabled: e.target.checked })}
            className="w-4 h-4 rounded" style={{ accentColor: UI.primary }} />
          <span className="text-sm font-medium" style={{ color: UI.dark }}>Activar el bingo para los invitados</span>
        </label>
      </div>

      {/* What's shown */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>¿Qué se mostrará en los cartones?</h3>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['numbers', 'emojis', 'photos'] as BingoCellType[]).map(t => (
            <button key={t} onClick={() => saveConfig({ cell_type: t })}
              className="py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: game.cell_type === t ? UI.primary : '#fff', color: game.cell_type === t ? '#fff' : UI.text, border: `1px solid ${game.cell_type === t ? UI.primary : '#e5e5e5'}` }}>
              {CELL_LABELS[t]}
            </button>
          ))}
        </div>

        {game.cell_type === 'numbers' && (
          <p className="text-xs mt-1 px-3 py-2 rounded-lg" style={{ color: UI.text, backgroundColor: UI.bg }}>
            Bingo español clásico · 90 bolas (1–90) · Cartones 3×9 con 15 números agrupados por decenas
          </p>
        )}

        {game.cell_type === 'emojis' && (
          <div>
            <div className="flex gap-2 mb-2">
              <input value={emojiInput} onChange={e => setEmojiInput(e.target.value)}
                placeholder="Pega uno o varios emojis 🎉🥂💍" className={inputClass} style={inputStyle} />
              <button
                onClick={() => {
                  const found = Array.from(emojiInput).filter(ch => ch.trim())
                  if (found.length) saveConfig({ items: [...new Set([...(game.items ?? []), ...found])] })
                  setEmojiInput('')
                }}
                className={primaryButtonClass} style={primaryButtonStyle}>Añadir</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(game.items ?? []).map((it, i) => (
                <span key={i} className="text-2xl relative group cursor-pointer" onClick={() => removeItem(i)} title="Quitar">
                  {it}<span className="absolute -top-1 -right-2 text-xs" style={{ color: UI.error }}>×</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {game.cell_type === 'photos' && (
          <div>
            <label className="inline-block px-4 py-2.5 rounded-xl text-sm font-medium text-white cursor-pointer" style={{ backgroundColor: UI.primary }}>
              {uploading ? 'Subiendo...' : '+ Subir foto'}
              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.target.value = '' }} />
            </label>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {(game.items ?? []).map((url, i) => (
                <div key={i} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover rounded-xl" />
                  <button onClick={() => removeItem(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs text-white flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!poolEnough && (
          <p className="text-xs mt-3" style={{ color: UI.error }}>
            Necesitas al menos {minPoolFor(game.card_size)} {game.cell_type === 'photos' ? 'fotos' : 'emojis'} para cartones de {SIZE_LABELS[game.card_size]} (ahora hay {pool.length}).
          </p>
        )}
      </div>

      {/* Cards per player */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: UI.dark }}>Cartones por jugador</h3>
        <p className="text-xs mb-3" style={{ color: UI.muted }}>Cada invitado recibe 1 o 2 cartones a la vez.</p>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map(n => (
            <button key={n} onClick={() => saveConfig({ cards_per_player: n })}
              className="py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: game.cards_per_player === n ? UI.primary : '#fff', color: game.cards_per_player === n ? '#fff' : UI.text, border: `1px solid ${game.cards_per_player === n ? UI.primary : '#e5e5e5'}` }}>
              {n === 1 ? '1 cartón' : '2 cartones'}
            </button>
          ))}
        </div>
      </div>

      {/* Fast mode */}
      {game.cell_type === 'numbers' && (
        <div className={cardClass} style={cardStyle}>
          <label className="flex items-center gap-3 cursor-pointer mb-1">
            <input type="checkbox" checked={game.fast_mode} onChange={e => saveConfig({ fast_mode: e.target.checked })}
              className="w-4 h-4 rounded" style={{ accentColor: UI.primary }} />
            <span className="text-sm font-medium" style={{ color: UI.dark }}>Modo rápido</span>
          </label>
          <p className="text-xs pl-7 mb-3" style={{ color: UI.muted }}>
            Al empezar, el pool se reduce a los números en juego + N extras aleatorios. Ideal para pocas personas.
          </p>
          {game.fast_mode && (
            <div className="pl-7 flex items-center gap-2">
              <label className="text-xs" style={{ color: UI.text }}>Números extra:</label>
              <input type="number" min={0} max={89} value={game.fast_pool_extras ?? 20}
                onChange={e => saveConfig({ fast_pool_extras: Math.min(89, Math.max(0, Number(e.target.value) || 0)) })}
                className={inputClass} style={{ ...inputStyle, width: 72 }} />
            </div>
          )}
        </div>
      )}

      {/* Card size — only for emojis/photos, Spanish bingo is always 3×9 */}
      {game.cell_type !== 'numbers' && (
        <div className={cardClass} style={cardStyle}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>Tamaño del cartón</h3>
          <div className="grid grid-cols-3 gap-2">
            {[9, 16, 25].map(s => (
              <button key={s} onClick={() => saveConfig({ card_size: s })}
                className="py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ backgroundColor: game.card_size === s ? UI.primary : '#fff', color: game.card_size === s ? '#fff' : UI.text, border: `1px solid ${game.card_size === s ? UI.primary : '#e5e5e5'}` }}>
                {SIZE_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Prizes */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>Premios</h3>
        <label className="flex items-center gap-3 cursor-pointer mb-2">
          <input type="checkbox" checked={game.line_prize_enabled} onChange={e => saveConfig({ line_prize_enabled: e.target.checked })}
            className="w-4 h-4 rounded" style={{ accentColor: UI.primary }} />
          <span className="text-sm" style={{ color: UI.dark }}>Premiar la primera <strong>línea</strong> (pausa el juego al cantarse)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={game.bingo_prize_enabled} onChange={e => saveConfig({ bingo_prize_enabled: e.target.checked })}
            className="w-4 h-4 rounded" style={{ accentColor: UI.primary }} />
          <span className="text-sm" style={{ color: UI.dark }}>Premiar el <strong>bingo</strong> (cartón completo)</span>
        </label>
      </div>

      {/* Share + lobby */}
      <div className={cardClass} style={cardStyle}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI.dark }}>Invita a jugar</h3>
        <div className="flex flex-col items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR del bingo" width={180} height={180} className="rounded-xl" />
          <div className="flex gap-2 w-full">
            <input readOnly value={joinUrl} className={inputClass} style={inputStyle} />
            <button onClick={() => { navigator.clipboard.writeText(joinUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              className={primaryButtonClass} style={{ ...primaryButtonStyle, backgroundColor: copied ? UI.success : UI.primary }}>
              {copied ? 'Copiado ✓' : 'Copiar'}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4" style={{ borderTop: '1px solid #eee' }}>
          <p className="text-sm mb-2" style={{ color: UI.text }}>
            {players.length === 0 ? 'Nadie se ha unido todavía' : `${players.length} ${players.length === 1 ? 'persona unida' : 'personas unidas'}`}
          </p>
          {players.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {players.map(p => (
                <span key={p.id} className="px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: UI.bg, color: UI.dark }}>{p.name}</span>
              ))}
            </div>
          )}
          <button
            onClick={() => control('start')}
            disabled={!game.enabled || !poolEnough}
            className={`${primaryButtonClass} w-full`}
            style={{ ...primaryButtonStyle, opacity: (!game.enabled || !poolEnough) ? 0.5 : 1 }}
          >
            Empezar partida
          </button>
          {!game.enabled && <p className="text-xs mt-2 text-center" style={{ color: UI.muted }}>Activa el bingo arriba para poder empezar.</p>}
        </div>
      </div>

      {msg && <p className="text-sm text-center" style={{ color: msg.startsWith('Error') ? UI.error : UI.success }}>{msg}</p>}
    </div>
  )
}
