'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Supabase processes the hash token automatically on mount
  useEffect(() => {
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  const inputClass = 'w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl italic mb-2" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
            Mi Boda
          </h1>
          <p className="text-sm" style={{ color: '#555555' }}>Nueva contraseña</p>
        </div>

        <div className="rounded-2xl p-6 shadow-sm" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
          {!ready ? (
            <div className="text-center py-4">
              <div className="w-8 h-8 border-2 border-amber-300 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm" style={{ color: '#555555' }}>Verificando enlace...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: '#555555' }}>Nueva contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className={inputClass}
                  style={{ borderColor: '#F4D7D7' }}
                  placeholder="••••••••"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: '#555555' }}>Repetir contraseña</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className={inputClass}
                  style={{ borderColor: '#F4D7D7' }}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: '#C9A84C' }}
              >
                {loading ? 'Guardando...' : 'Guardar contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
