import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'Invitaciones de Boda',
  description: 'Crea tu página de boda personalizada y gestiona las confirmaciones de tus invitados.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://miboda.app'),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
