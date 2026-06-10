'use client'

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="text-5xl mb-4">💔</div>
      <h1 className="text-3xl italic mb-3" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Algo ha salido mal
      </h1>
      <p className="text-sm mb-8 max-w-md" style={{ color: '#555555' }}>
        Ha ocurrido un error inesperado. Inténtalo de nuevo; si el problema persiste, vuelve más tarde.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-xl text-white text-sm font-medium"
        style={{ backgroundColor: '#C9A84C' }}
      >
        Reintentar
      </button>
    </div>
  )
}
