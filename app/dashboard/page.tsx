import Link from 'next/link'
import { requireUser } from '@/lib/dashboard'
import { formatDate } from '@/lib/utils'

function daysUntil(dateStr: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
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
        <p className="text-5xl mb-6">💍</p>
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
    days > 1 ? `Faltan ${days} días` :
    days === 1 ? '¡Mañana es el gran día!' :
    days === 0 ? '¡Hoy es el gran día!' :
    'La boda ya pasó'

  const [
    { count: confirmedCount },
    { count: declinedCount },
    { data: aggregates },
    { count: pendingCount },
    { count: totalExpected },
  ] = await Promise.all([
    supabase.from('rsvp_responses').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id).eq('attendance', true),
    supabase.from('rsvp_responses').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id).eq('attendance', false),
    supabase.from('rsvp_responses').select('adults_count, children_count, bus_outbound, bus_return').eq('wedding_id', wedding.id).eq('attendance', true),
    supabase.from('expected_guests').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id).is('rsvp_response_id', null),
    supabase.from('expected_guests').select('*', { count: 'exact', head: true }).eq('wedding_id', wedding.id),
  ])

  const totalAdults = (aggregates ?? []).reduce((s, r) => s + (r.adults_count ?? 0), 0)
  const totalChildren = (aggregates ?? []).reduce((s, r) => s + (r.children_count ?? 0), 0)
  const needsBus = (aggregates ?? []).filter((r) => r.bus_outbound || r.bus_return).length
  const responded = (confirmedCount ?? 0) + (declinedCount ?? 0)
  const total = totalExpected ?? 0
  const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0

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
                {responded} de {total} invitados han respondido
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
            <span className="text-xs" style={{ color: '#4CAF50' }}>✓ {confirmedCount ?? 0} asisten</span>
            <span className="text-xs" style={{ color: '#EF5350' }}>✕ {declinedCount ?? 0} no asisten</span>
            <span className="text-xs" style={{ color: '#C9A84C' }}>⏳ {pendingCount ?? 0} pendientes</span>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#888' }}>
          Invitados confirmados
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Adultos', value: totalAdults, icon: '👥', color: '#2196F3' },
            { label: 'Niños', value: totalChildren, icon: '👦', color: '#9C27B0' },
            { label: 'Autobús', value: needsBus, icon: '🚌', color: '#FF9800' },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl p-4 flex flex-col gap-1 text-center"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
            >
              <span className="text-xl">{s.icon}</span>
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
          {[
            { href: '/dashboard/invitados', label: 'Ver confirmaciones', desc: 'Quién asiste y detalles', icon: '✅' },
            { href: '/dashboard/configurar', label: 'Editar información', desc: 'Lugar, hora y detalles', icon: '⚙️' },
            { href: '/dashboard/lista', label: 'Lista de invitados', desc: 'Gestiona los esperados', icon: '📋' },
            { href: '/dashboard/mesas', label: 'Distribución de mesas', desc: 'Organiza los asientos', icon: '🪑' },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:shadow-md hover:-translate-y-px"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
            >
              <span className="text-xl flex-shrink-0">{link.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: '#2D2D2D' }}>{link.label}</p>
                <p className="text-xs truncate" style={{ color: '#888' }}>{link.desc}</p>
              </div>
              <svg className="w-4 h-4 flex-shrink-0 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ccc' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
