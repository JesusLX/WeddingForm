'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      router.push('/dashboard')
      router.refresh()
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/dashboard` },
      })
      if (error) { setError(error.message); setLoading(false); return }
      setMessage('Revisa tu email para confirmar el registro.')
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#FAF7F4' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1
            className="text-4xl italic mb-2"
            style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
          >
            Mi Boda
          </h1>
          <p className="text-sm" style={{ color: '#555555' }}>
            {mode === 'login' ? 'Accede a tu panel de boda' : 'Crea tu cuenta'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4 shadow-sm"
          style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
        >
          <div>
            <label className="block text-sm mb-1" style={{ color: '#555555' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
              style={{ borderColor: '#F4D7D7' }}
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={{ color: '#555555' }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={inputClass}
              style={{ borderColor: '#F4D7D7' }}
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>

          <p className="text-center text-sm" style={{ color: '#555555' }}>
            {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
              className="font-medium underline"
              style={{ color: '#C9A84C' }}
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
