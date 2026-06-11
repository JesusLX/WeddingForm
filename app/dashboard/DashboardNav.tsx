'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useState, type ReactNode } from 'react'

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  resumen: (
    <Svg>
      <path d="M3 20h18" />
      <path d="M7 20V9" /><path d="M12 20V4" /><path d="M17 20V13" />
    </Svg>
  ),
  configurar: (
    <Svg>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2.5" /><circle cx="15" cy="12" r="2.5" /><circle cx="9" cy="18" r="2.5" />
    </Svg>
  ),
  menu: (
    <Svg>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M9 5c0-1.1.9-2 2-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      <path d="M9 12h6M9 16h4" />
    </Svg>
  ),
  autobus: (
    <Svg>
      <rect x="1" y="6" width="22" height="14" rx="2" />
      <path d="M16 6V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2" />
      <path d="M1 12h22M7 20v-2M17 20v-2" />
      <circle cx="6.5" cy="16" r="1" /><circle cx="17.5" cy="16" r="1" />
    </Svg>
  ),
  clock: (
    <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Svg>
  ),
  faq: (
    <Svg>
      <circle cx="12" cy="12" r="10" />
      <path d="M9 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth={2} />
    </Svg>
  ),
  apariencia: (
    <Svg>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-5-5L5 21" />
    </Svg>
  ),
  invitados: (
    <Svg>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </Svg>
  ),
  mesas: (
    <Svg>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </Svg>
  ),
  calendar: (
    <Svg>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  ),
  camera: (
    <Svg>
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </Svg>
  ),
  mail: (
    <Svg>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <path d="M22 6l-10 7L2 6" />
    </Svg>
  ),
}

type NavItem = {
  href: string
  label: string
  icon: ReactNode
  alsoActive?: string[]
}

const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: '/dashboard', label: 'Resumen', icon: ICONS.resumen },
    ],
  },
  {
    label: 'Tu boda',
    items: [
      { href: '/dashboard/configurar', label: 'Configurar', icon: ICONS.configurar },
      { href: '/dashboard/menu', label: 'Menú y autobús', icon: ICONS.menu, alsoActive: ['/dashboard/autobus'] },
      { href: '/dashboard/timeline', label: 'Programa del día', icon: ICONS.clock },
      { href: '/dashboard/eventos', label: 'Eventos extra', icon: ICONS.calendar },
      { href: '/dashboard/faq', label: 'FAQ', icon: ICONS.faq },
      { href: '/dashboard/apariencia', label: 'Apariencia', icon: ICONS.apariencia },
    ],
  },
  {
    label: 'Invitados',
    items: [
      { href: '/dashboard/invitados', label: 'Invitados', icon: ICONS.invitados, alsoActive: ['/dashboard/lista'] },
      { href: '/dashboard/galeria-colaborativa', label: 'Galería colaborativa', icon: ICONS.camera },
      { href: '/dashboard/recordatorios', label: 'Recordatorios', icon: ICONS.mail },
      { href: '/dashboard/mesas', label: 'Distribución de mesas', icon: ICONS.mesas },
    ],
  },
]

type WeddingProp = { id: string; slug: string; partner_1: string; partner_2: string } | null

function SidebarContent({
  wedding,
  pathname,
  onNavigate,
  onSignOut,
  showClose,
}: {
  wedding: WeddingProp
  pathname: string
  onNavigate: () => void
  onSignOut: () => void
  showClose?: boolean
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.15em] mb-1.5 font-medium" style={{ color: 'rgba(201,168,76,0.5)' }}>
              Panel de boda
            </p>
            <p
              className="text-base italic leading-tight truncate"
              style={{ color: '#C9A84C', fontFamily: 'var(--font-playfair)' }}
            >
              {wedding ? `${wedding.partner_1} & ${wedding.partner_2}` : 'Mi Boda'}
            </p>
          </div>
          {showClose && (
            <button
              onClick={onNavigate}
              className="flex-shrink-0 mt-0.5 rounded-lg p-1 transition-colors"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {wedding && (
          <a
            href={`/boda/${wedding.slug}`}
            target="_blank"
            className="mt-3 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ backgroundColor: 'rgba(201,168,76,0.12)', color: '#C9A84C' }}
          >
            Ver página pública
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <p
                className="px-3 mb-1 text-[10px] uppercase tracking-[0.15em] font-semibold"
                style={{ color: 'rgba(255,255,255,0.2)' }}
              >
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href || (item.alsoActive ?? []).includes(pathname)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                      style={{
                        color: active ? '#C9A84C' : 'rgba(255,255,255,0.6)',
                        backgroundColor: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                        borderLeft: `2px solid ${active ? '#C9A84C' : 'transparent'}`,
                        fontWeight: active ? 500 : 400,
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-colors hover:bg-white/5"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export function DashboardNav({ wedding }: { wedding: WeddingProp }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const sharedProps = {
    wedding,
    pathname,
    onNavigate: () => setDrawerOpen(false),
    onSignOut: signOut,
  }

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 z-30"
        style={{ backgroundColor: '#1C1917' }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden sticky top-0 z-20 flex items-center justify-between px-4 h-14"
        style={{ backgroundColor: '#1C1917', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-1.5 rounded-lg -ml-1.5"
          style={{ color: 'rgba(255,255,255,0.6)' }}
          aria-label="Abrir menú"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span
          className="text-sm italic"
          style={{ color: '#C9A84C', fontFamily: 'var(--font-playfair)' }}
        >
          {wedding ? `${wedding.partner_1} & ${wedding.partner_2}` : 'Mi Boda'}
        </span>
        {wedding ? (
          <a
            href={`/boda/${wedding.slug}`}
            target="_blank"
            className="text-xs"
            style={{ color: '#C9A84C' }}
          >
            Ver ↗
          </a>
        ) : (
          <span className="w-8" />
        )}
      </div>

      {/* Mobile overlay */}
      {drawerOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 z-50 flex flex-col transition-transform duration-300 ease-in-out ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: '#1C1917' }}
      >
        <SidebarContent {...sharedProps} showClose />
      </aside>
    </>
  )
}
