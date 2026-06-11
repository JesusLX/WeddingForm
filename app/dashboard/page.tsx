import Link from 'next/link'
import { requireUser } from '@/lib/dashboard'
import { formatDate } from '@/lib/utils'
import type { ReactNode } from 'react'

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function Svg({ children, className = 'w-5 h-5' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  )
}

const ICONS = {
  ring: (
    <Svg className="w-12 h-12">
      <circle cx="12" cy="12" r="4" />
      <path d="M8 12a4 4 0 018 0" />
      <path d="M9.5 8.5L8 6h8l-1.5 2.5" />
    </Svg>
  ),
  adults: (
    <Svg>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </Svg>
  ),
  child: (
    <Svg>
      <circle cx="12" cy="6" r="3" />
      <path d="M12 9v6M9 21l3-6 3 6" />
      <path d="M9 13h6" />
    </Svg>
  ),
  bus: (
    <Svg>
      <rect x="1" y="6" width="22" height="14" rx="2" />
      <path d="M16 6V4a2 2 0 00-2-2H10a2 2 0 00-2 2v2" />
      <path d="M1 12h22M7 20v-2M17 20v-2" />
      <circle cx="6.5" cy="16" r="1" /><circle cx="17.5" cy="16" r="1" />
    </Svg>
  ),
  check: (
    <Svg>
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </Svg>
  ),
  settings: (
    <Svg>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </Svg>
  ),
  list: (
    <Svg>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <path d="M9 5c0-1.1.9-2 2-2h2a2 2 0 012 2v0a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      <path d="M9 12h6M9 16h4" />
    </Svg>
  ),
  table: (
    <Svg>
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </Svg>
  ),
  checkSmall: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  xSmall: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  clockSmall: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
    </svg>
  ),
  chevron: (
    <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"
      style={{ color: '#ccc' }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
}

export default async function DashboardPage() {
  const { supabase, user } = await requireUser()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!wedding) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="mb-6" style={{ color: '#C9A84C' }}>{ICONS.ring}</div>
        <h1
          className="text-3xl italic mb-3"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          Bienvenido/a
        </h1>
        <p className="mb-8 max-w-xs text-sm leading-relaxed" style={{ color: '#555' }}>
          Aún no tienes una boda configurada. Empieza añadiendo los datos de tu boda.
        </p>
        <Link
          href="/dashboard/configurar"
          className="px-7 py-3 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C9A84C' }}
        >
          Crear mi boda →
        </Link>
      </div>
    )
  }

  const days = daysUntil(wedding.wedding_date)
  const daysLabel =
    days > 1  ? `Faltan ${days} días` :
    days === 1 ? '¡Mañana es el gran día!' :
    days === 0 ? '¡Hoy es el gran día!' :
    'La boda ya pasó'

  const [
    { count: declinedCount },
    { data: aggregates },
    { count: pendingCount },
    { count: totalExpected },
  ] = await Promise.all([
    supabase.from('rsvp_responses').select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id).eq('attendance', false),
    supabase.from('rsvp_responses')
      .select('adults_count, children_count, bus_outbound, bus_return')
      .eq('wedding_id', wedding.id).eq('attendance', true),
    supabase.from('expected_guests').select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id).is('rsvp_response_id', null),
    supabase.from('expected_guests').select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id),
  ])

  const totalAdults   = (aggregates ?? []).reduce((s, r) => s + (r.adults_count   ?? 0), 0)
  const totalChildren = (aggregates ?? []).reduce((s, r) => s + (r.children_count ?? 0), 0)
  const totalAttending = totalAdults + totalChildren
  const needsBus      = (aggregates ?? []).filter((r) => r.bus_outbound || r.bus_return).length

  const total             = totalExpected ?? 0
  const pending           = pendingCount  ?? 0
  const respondedExpected = total - pending
  const responseRate      = total > 0 ? Math.round((respondedExpected / total) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest mb-1.5 font-medium" style={{ color: '#C9A84C' }}>
            Tu boda
          </p>
          <h1
            className="text-3xl italic leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
          >
            {wedding.partner_1} & {wedding.partner_2}
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#888' }}>
            {formatDate(wedding.wedding_date)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              backgroundColor: days > 0 ? 'rgba(201,168,76,0.1)' : 'rgba(76,175,80,0.1)',
              color: days > 0 ? '#C9A84C' : '#4CAF50',
            }}
          >
            {daysLabel}
          </span>
          <span
            className="text-xs px-3 py-1.5 rounded-full font-medium"
            style={{
              backgroundColor: wedding.is_published ? 'rgba(76,175,80,0.1)' : 'rgba(239,83,80,0.1)',
              color: wedding.is_published ? '#4CAF50' : '#EF5350',
            }}
          >
            {wedding.is_published ? '● Publicada' : '● No publicada'}
          </span>
        </div>
      </div>

      {/* Response rate card */}
      {total > 0 && (
        <div
          className="rounded-2xl p-5"
          style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium" style={{ color: '#2D2D2D' }}>Tasa de respuesta</p>
              <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                {respondedExpected} de {total} invitados han respondido
              </p>
            </div>
            <span
              className="text-2xl font-bold italic"
              style={{ fontFamily: 'var(--font-playfair)', color: '#C9A84C' }}
            >
              {responseRate}%
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F4D7D7' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${responseRate}%`, backgroundColor: '#C9A84C' }}
            />
          </div>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1 text-xs" style={{ color: '#4CAF50' }}>
              {ICONS.checkSmall} {totalAttending} asisten
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: '#EF5350' }}>
              {ICONS.xSmall} {declinedCount ?? 0} no asisten
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: '#C9A84C' }}>
              {ICONS.clockSmall} {pending} pendientes
            </span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
          Invitados confirmados
        </p>
        <div className="grid grid-cols-3 gap-3">
          {([
            { label: 'Adultos',  value: totalAdults,   icon: ICONS.adults, color: '#2196F3' },
            { label: 'Niños',    value: totalChildren,  icon: ICONS.child,  color: '#9C27B0' },
            { label: 'Autobús',  value: needsBus,       icon: ICONS.bus,    color: '#FF9800' },
          ] as const).map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 flex flex-col items-center gap-1.5"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
            >
              <span style={{ color: s.color }}>{s.icon}</span>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: 'var(--font-playfair)', color: s.color }}
              >
                {s.value}
              </span>
              <span className="text-xs" style={{ color: '#888' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
          Acceso rápido
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {([
            { href: '/dashboard/invitados', label: 'Ver confirmaciones',      desc: 'Quién asiste y detalles',   icon: ICONS.check    },
            { href: '/dashboard/configurar', label: 'Editar información',     desc: 'Lugar, hora y detalles',    icon: ICONS.settings },
            { href: '/dashboard/lista',      label: 'Lista de invitados',     desc: 'Gestiona los esperados',    icon: ICONS.list     },
            { href: '/dashboard/mesas',      label: 'Distribución de mesas', desc: 'Organiza los asientos',     icon: ICONS.table    },
          ] as const).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:shadow-md hover:-translate-y-px"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
            >
              <span className="flex-shrink-0" style={{ color: '#C9A84C' }}>{link.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: '#2D2D2D' }}>{link.label}</p>
                <p className="text-xs truncate" style={{ color: '#888' }}>{link.desc}</p>
              </div>
              {ICONS.chevron}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
