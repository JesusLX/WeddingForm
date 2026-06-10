import Link from 'next/link'
import { ScrollReveal } from '@/components/ScrollReveal'

const GOLD = '#C9A84C'
const DARK = '#2D2D2D'
const BLUSH = '#F4D7D7'
const CREAM = '#FAF7F4'

export default function HomePage() {
  const features = [
    { icon: '💌', title: 'Confirmaciones sin perseguir a nadie', desc: 'Tus invitados confirman desde el móvil en un minuto: asistencia, acompañantes, menú, alergias y autobús.' },
    { icon: '🎨', title: 'Tu paleta, tu estilo', desc: 'Elige los colores de vuestra boda y toda la página se adapta. Elegante en cualquier pantalla.' },
    { icon: '🪑', title: 'Mesas sin dolores de cabeza', desc: 'Indica quién se lleva bien con quién y el organizador de mesas hace el resto automáticamente.' },
    { icon: '📊', title: 'Todo bajo control', desc: 'Panel en tiempo real: quién ha confirmado, quién falta, cuántos menús de cada tipo y plazas de autobús.' },
    { icon: '🎵', title: 'La banda sonora de la noche', desc: 'Comparte vuestra playlist y deja que cada invitado pida su canción imprescindible.' },
    { icon: '📄', title: 'Exporta cuando quieras', desc: 'Cada respuesta llega también a tu Google Sheets y puedes descargar todo en CSV con un clic.' },
  ]

  const steps = [
    { n: '1', title: 'Crea vuestra página', desc: 'Nombres, fecha, lugar, vuestra historia y fotos. En menos de 10 minutos está lista.' },
    { n: '2', title: 'Comparte el enlace', desc: 'Por WhatsApp, en la invitación de papel con un QR o como quieras. Sin apps, sin registros para tus invitados.' },
    { n: '3', title: 'Relájate y mira llegar las confirmaciones', desc: 'Cada respuesta aparece al instante en tu panel, con menús, alergias y autobús ya organizados.' },
  ]

  return (
    <main style={{ backgroundColor: CREAM }}>
      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        {/* Decorative blurred circles */}
        <div aria-hidden className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-40" style={{ background: `radial-gradient(circle, ${BLUSH}, transparent 70%)` }} />
        <div aria-hidden className="absolute -bottom-40 -right-24 w-[28rem] h-[28rem] rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${GOLD}33, transparent 70%)` }} />

        <div className="relative z-10 pt-20 pb-10">
          <p className="uppercase tracking-[0.35em] text-xs mb-6" style={{ color: GOLD }}>
            ✦ Tu boda, a tu manera ✦
          </p>
          <h1
            className="text-5xl md:text-7xl italic mb-6 leading-tight"
            style={{ fontFamily: 'var(--font-playfair)', color: DARK }}
          >
            La invitación de boda
            <br />
            que tus invitados
            <br />
            <span style={{ color: GOLD }}>recordarán</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto mb-10" style={{ color: '#555555' }}>
            Una página de boda preciosa con confirmación de asistencia incluida.
            Menús, autobús, mesas y lista de invitados: todo organizado sin hojas de cálculo a mano
            ni cadenas interminables de WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 rounded-full text-white font-semibold text-base transition-all hover:opacity-90 hover:scale-105 shadow-lg"
              style={{ backgroundColor: GOLD, boxShadow: `0 10px 30px ${GOLD}55` }}
            >
              Crear mi boda gratis →
            </Link>
            <Link
              href="/boda/demo"
              className="px-8 py-4 rounded-full font-semibold text-base transition-all hover:bg-white"
              style={{ color: DARK, border: `1px solid ${GOLD}66` }}
            >
              Ver una boda de ejemplo
            </Link>
          </div>
          <p className="mt-6 text-xs" style={{ color: '#999' }}>
            Gratis para empezar · Sin tarjeta · Tus invitados no necesitan registrarse
          </p>
        </div>

        {/* Mock invitation card */}
        <ScrollReveal className="relative z-10 w-full max-w-sm mx-auto mb-16">
          <div
            className="rounded-3xl px-8 py-10 text-center shadow-2xl"
            style={{ backgroundColor: 'white', border: `1px solid ${BLUSH}`, transform: 'rotate(-1.5deg)' }}
          >
            <p className="uppercase tracking-[0.3em] text-[10px] mb-3" style={{ color: GOLD }}>Nos casamos</p>
            <p className="text-3xl italic mb-1" style={{ fontFamily: 'var(--font-playfair)', color: DARK }}>
              María <span style={{ color: GOLD }}>&</span> Jesús
            </p>
            <p className="text-xs mb-5" style={{ color: '#888' }}>Sábado, 12 de septiembre de 2026 · Sevilla</p>
            <div className="h-px w-12 mx-auto mb-5" style={{ backgroundColor: GOLD }} />
            <div className="flex justify-center gap-2 mb-5">
              <span className="px-4 py-2 rounded-full text-xs font-medium text-white" style={{ backgroundColor: GOLD }}>🥂 Sí, allí estaré</span>
              <span className="px-4 py-2 rounded-full text-xs font-medium" style={{ color: '#888', border: `1px solid ${BLUSH}` }}>😔 No podré ir</span>
            </div>
            <p className="text-[10px]" style={{ color: '#bbb' }}>Confirma en menos de un minuto</p>
          </div>
        </ScrollReveal>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: GOLD }}>Así de fácil</p>
              <h2 className="text-4xl md:text-5xl italic mb-4" style={{ fontFamily: 'var(--font-playfair)', color: DARK }}>
                Lista en tres pasos
              </h2>
              <div className="h-px w-16 mx-auto" style={{ backgroundColor: GOLD }} />
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <ScrollReveal key={s.n}>
                <div className="text-center px-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 text-xl italic"
                    style={{ fontFamily: 'var(--font-playfair)', color: GOLD, border: `1.5px solid ${GOLD}`, backgroundColor: CREAM }}
                  >
                    {s.n}
                  </div>
                  <h3 className="font-semibold mb-2 text-lg" style={{ color: DARK }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6" style={{ backgroundColor: CREAM }}>
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-14">
              <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: GOLD }}>Funcionalidades</p>
              <h2 className="text-4xl md:text-5xl italic mb-4" style={{ fontFamily: 'var(--font-playfair)', color: DARK }}>
                Todo lo que necesitas,
                <br />
                nada que no
              </h2>
              <div className="h-px w-16 mx-auto" style={{ backgroundColor: GOLD }} />
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <ScrollReveal key={f.title}>
                <div
                  className="rounded-2xl p-6 h-full bg-white transition-all hover:-translate-y-1 hover:shadow-xl"
                  style={{ border: `1px solid ${BLUSH}` }}
                >
                  <span className="text-3xl block mb-3">{f.icon}</span>
                  <h3 className="font-semibold mb-2" style={{ color: DARK }}>{f.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#555555' }}>{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* For guests strip */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <ScrollReveal>
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: GOLD }}>Para tus invitados</p>
            <h2 className="text-3xl md:text-4xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: DARK }}>
              Cero fricción para ellos
            </h2>
            <div className="flex flex-wrap justify-center gap-3 text-sm">
              {['Sin descargar apps', 'Sin crear cuentas', 'Desde cualquier móvil', 'En menos de 1 minuto'].map(t => (
                <span
                  key={t}
                  className="px-5 py-2.5 rounded-full font-medium"
                  style={{ backgroundColor: CREAM, color: DARK, border: `1px solid ${BLUSH}` }}
                >
                  ✓ {t}
                </span>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 text-center overflow-hidden" style={{ backgroundColor: DARK }}>
        <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[40rem] h-[40rem] rounded-full opacity-10" style={{ background: `radial-gradient(circle, ${GOLD}, transparent 65%)` }} />
        <div className="relative z-10">
          <p className="uppercase tracking-[0.3em] text-xs mb-5" style={{ color: GOLD }}>✦ El gran día se acerca ✦</p>
          <h2
            className="text-4xl md:text-6xl italic mb-6 text-white leading-tight"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Dedica tu tiempo a la boda,
            <br />
            no a las hojas de cálculo
          </h2>
          <p className="mb-10 text-white/70 max-w-md mx-auto">
            Crea vuestra página hoy y empieza a recibir confirmaciones esta misma semana.
          </p>
          <Link
            href="/login"
            className="inline-block px-10 py-5 rounded-full font-semibold text-lg transition-all hover:opacity-90 hover:scale-105"
            style={{ backgroundColor: GOLD, color: 'white', boxShadow: `0 10px 40px ${GOLD}66` }}
          >
            Crear mi página de boda gratis
          </Link>
          <p className="mt-6 text-xs text-white/40">Sin tarjeta de crédito · Cancela cuando quieras</p>
        </div>
      </section>
    </main>
  )
}
