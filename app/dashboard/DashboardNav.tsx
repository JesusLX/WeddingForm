'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: '📊' },
  { href: '/dashboard/configurar', label: 'Configurar', icon: '⚙️' },
  { href: '/dashboard/menu', label: 'Menú', icon: '🍽️' },
  { href: '/dashboard/autobus', label: 'Autobús', icon: '🚌' },
  { href: '/dashboard/timeline', label: 'Programa', icon: '🕐' },
  { href: '/dashboard/faq', label: 'FAQ', icon: '❓' },
  { href: '/dashboard/galeria', label: 'Galería', icon: '🖼️' },
  { href: '/dashboard/paleta', label: 'Paleta', icon: '🎨' },
  { href: '/dashboard/spotify', label: 'Spotify', icon: '🎵' },
  { href: '/dashboard/lista', label: 'Lista invitados', icon: '📋' },
  { href: '/dashboard/invitados', label: 'Confirmaciones', icon: '✅' },
  { href: '/dashboard/mesas', label: 'Mesas', icon: '🪑' },
  { href: '/dashboard/sheets', label: 'Google Sheets', icon: '📄' },
]

export function DashboardNav({
  wedding,
}: {
  wedding: { id: string; slug: string; partner_1: string; partner_2: string } | null
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header style={{ backgroundColor: '#2D2D2D' }}>
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="text-lg italic hidden sm:block"
            style={{ color: '#C9A84C', fontFamily: 'var(--font-playfair)' }}
          >
            {wedding ? `${wedding.partner_1} & ${wedding.partner_2}` : 'Mi Boda'}
          </span>
          {wedding && (
            <a
              href={`/boda/${wedding.slug}`}
              target="_blank"
              className="text-xs px-2 py-1 rounded-full"
              style={{ backgroundColor: '#C9A84C22', color: '#C9A84C' }}
            >
              Ver página ↗
            </a>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="sm:hidden text-white"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-1 flex-wrap">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                color: pathname === item.href ? '#C9A84C' : '#ffffff88',
                backgroundColor: pathname === item.href ? '#C9A84C22' : 'transparent',
              }}
            >
              {item.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="px-3 py-1.5 rounded-lg text-xs font-medium ml-2 transition-opacity hover:opacity-80"
            style={{ color: '#ffffff66' }}
          >
            Salir
          </button>
        </nav>
      </div>

      {/* Mobile nav dropdown */}
      {menuOpen && (
        <nav className="sm:hidden px-4 pb-4 grid grid-cols-3 gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs text-center"
              style={{
                color: pathname === item.href ? '#C9A84C' : '#ffffffaa',
                backgroundColor: pathname === item.href ? '#C9A84C22' : 'transparent',
              }}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
          <button
            onClick={signOut}
            className="flex flex-col items-center gap-1 p-2 rounded-xl text-xs"
            style={{ color: '#ffffff66' }}
          >
            <span className="text-lg">🚪</span>
            Salir
          </button>
        </nav>
      )}
    </header>
  )
}
