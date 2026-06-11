import Link from 'next/link'

export function GuestTabs({ active }: { active: 'lista' | 'confirmaciones' }) {
  return (
    <div className="flex mb-6" style={{ borderBottom: '2px solid #F4D7D7' }}>
      {([
        { href: '/dashboard/lista', key: 'lista', label: '📋 Lista de invitados' },
        { href: '/dashboard/invitados', key: 'confirmaciones', label: '✅ Confirmaciones' },
      ] as const).map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className="px-5 py-2.5 text-sm font-medium transition-colors"
          style={{
            color: active === tab.key ? '#C9A84C' : '#888',
            borderBottom: `2px solid ${active === tab.key ? '#C9A84C' : 'transparent'}`,
            marginBottom: -2,
          }}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  )
}
