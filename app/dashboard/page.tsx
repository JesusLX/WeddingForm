import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { formatDate } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!wedding) {
    return (
      <div className="text-center py-20">
        <h1
          className="text-3xl italic mb-4"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          Bienvenido/a
        </h1>
        <p className="mb-6" style={{ color: '#555555' }}>Aún no tienes una boda configurada.</p>
        <Link
          href="/dashboard/configurar"
          className="px-6 py-3 rounded-xl text-white font-medium"
          style={{ backgroundColor: '#C9A84C' }}
        >
          Crear mi boda
        </Link>
      </div>
    )
  }

  // Stats — parallel queries with aggregation
  const [
    { count: confirmedCount },
    { count: declinedCount },
    { data: aggregates },
    { count: pendingCount },
  ] = await Promise.all([
    supabase
      .from('rsvp_responses')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id)
      .eq('attendance', true),
    supabase
      .from('rsvp_responses')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id)
      .eq('attendance', false),
    supabase
      .from('rsvp_responses')
      .select('adults_count, children_count, bus_option')
      .eq('wedding_id', wedding.id)
      .eq('attendance', true),
    supabase
      .from('expected_guests')
      .select('*', { count: 'exact', head: true })
      .eq('wedding_id', wedding.id)
      .is('rsvp_response_id', null),
  ])

  const totalAdults = (aggregates ?? []).reduce((s, r) => s + (r.adults_count ?? 0), 0)
  const totalChildren = (aggregates ?? []).reduce((s, r) => s + (r.children_count ?? 0), 0)
  const needsBus = (aggregates ?? []).filter((r) => r.bus_option && r.bus_option !== 'none').length

  const stats = [
    { label: 'Confirmados', value: confirmedCount ?? 0, color: '#4CAF50', emoji: '✅' },
    { label: 'No asisten', value: declinedCount ?? 0, color: '#EF5350', emoji: '❌' },
    { label: 'Pendientes', value: pendingCount ?? 0, color: '#C9A84C', emoji: '⏳' },
    { label: 'Adultos totales', value: totalAdults, color: '#2196F3', emoji: '👥' },
    { label: 'Niños totales', value: totalChildren, color: '#9C27B0', emoji: '👦' },
    { label: 'Autobús', value: needsBus, color: '#FF9800', emoji: '🚌' },
  ]

  const quickLinks = [
    { href: '/dashboard/configurar', label: 'Editar información', icon: '⚙️' },
    { href: '/dashboard/invitados', label: 'Ver confirmaciones', icon: '✅' },
    { href: '/dashboard/lista', label: 'Lista de invitados', icon: '📋' },
    { href: '/dashboard/sheets', label: 'Conectar Google Sheets', icon: '📄' },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1
          className="text-3xl italic mb-1"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          {wedding.partner_1} & {wedding.partner_2}
        </h1>
        <p className="text-sm" style={{ color: '#555555' }}>
          {formatDate(wedding.wedding_date)} · {wedding.is_published ? '🟢 Publicada' : '🔴 No publicada'}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl p-5 flex flex-col gap-1"
            style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
          >
            <span className="text-2xl">{s.emoji}</span>
            <span
              className="text-3xl font-bold"
              style={{ fontFamily: 'var(--font-playfair)', color: s.color }}
            >
              {s.value}
            </span>
            <span className="text-xs" style={{ color: '#555555' }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-sm font-medium mb-3" style={{ color: '#555555' }}>Acceso rápido</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-opacity hover:opacity-80"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7', color: '#2D2D2D' }}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
