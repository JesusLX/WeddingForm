import Link from 'next/link'

export default function HomePage() {
  const features = [
    { icon: '💌', title: 'Formulario RSVP', desc: 'Confirmación de asistencia, menú, autobús, alergias y más.' },
    { icon: '🗺️', title: 'Mapa interactivo', desc: 'Muestra la ubicación de la ceremonia y el convite en Google Maps.' },
    { icon: '🎵', title: 'Playlist Spotify', desc: 'Comparte vuestra música y recibe sugerencias de canciones.' },
    { icon: '📊', title: 'Panel de control', desc: 'Ve en tiempo real quién ha confirmado y exporta a CSV.' },
    { icon: '📄', title: 'Google Sheets', desc: 'Las respuestas van directamente a tu hoja de cálculo.' },
    { icon: '⏳', title: 'Pendientes', desc: 'Sube tu lista y ve quién aún no ha respondido.' },
  ]

  return (
    <main style={{ backgroundColor: '#FAF7F4' }}>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
          Tu boda, a tu manera
        </p>
        <h1
          className="text-5xl md:text-7xl italic mb-6"
          style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
        >
          La página de boda
          <br />
          que tus invitados
          <br />
          recordarán
        </h1>
        <p className="text-lg max-w-xl mb-10" style={{ color: '#555555' }}>
          Crea una página personalizada para tu boda en minutos. Gestiona confirmaciones,
          menús, transporte y más desde un panel sencillo.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/login"
            className="px-8 py-4 rounded-2xl text-white font-semibold text-base transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Crear mi boda gratis
          </Link>
          <Link
            href="/boda/demo"
            className="px-8 py-4 rounded-2xl font-semibold text-base transition-all hover:bg-white"
            style={{ color: '#2D2D2D', border: '1px solid #F4D7D7' }}
          >
            Ver ejemplo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2
              className="text-4xl italic mb-4"
              style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
            >
              Todo lo que necesitas
            </h2>
            <div className="h-px w-16 mx-auto" style={{ backgroundColor: '#C9A84C' }} />
          </div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6"
                style={{ border: '1px solid #F4D7D7' }}
              >
                <span className="text-3xl block mb-3">{f.icon}</span>
                <h3 className="font-semibold mb-1" style={{ color: '#2D2D2D' }}>{f.title}</h3>
                <p className="text-sm" style={{ color: '#555555' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center" style={{ backgroundColor: '#2D2D2D' }}>
        <h2
          className="text-4xl italic mb-4 text-white"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          Empieza hoy, gratis
        </h2>
        <p className="mb-8 text-white/70">Sin tarjeta de crédito. Sin complicaciones.</p>
        <Link
          href="/login"
          className="px-8 py-4 rounded-2xl font-semibold text-base transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#C9A84C', color: 'white' }}
        >
          Crear mi página de boda
        </Link>
      </section>
    </main>
  )
}
