import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="text-5xl mb-4">💌</div>
      <h1 className="text-3xl italic mb-3" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Página no encontrada
      </h1>
      <p className="text-sm mb-8 max-w-md" style={{ color: '#555555' }}>
        La página que buscas no existe o la boda ya no está publicada.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-xl text-white text-sm font-medium"
        style={{ backgroundColor: '#C9A84C' }}
      >
        Ir al inicio
      </Link>
    </div>
  )
}
