import { ScrollReveal } from '@/components/ScrollReveal'
import { RSVPForm } from './RSVPForm'
import type { Wedding, MenuOption, BusRoute } from '@/lib/types'

export function RSVPSection({
  wedding,
  menuOptions,
  busRoutes,
}: {
  wedding: Wedding
  menuOptions: MenuOption[]
  busRoutes: BusRoute[]
}) {
  return (
    <section id="rsvp" className="py-24 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
              Confirmación
            </p>
            <h2
              className="text-4xl md:text-5xl italic mb-4"
              style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
            >
              ¿Vendrás?
            </h2>
            <div className="h-px w-16 mx-auto mb-6" style={{ backgroundColor: 'var(--w-primary)' }} />
            <p className="text-sm" style={{ color: '#555555' }}>
              Rellena el formulario y dinos que podemos contar contigo.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="rounded-2xl p-6 md:p-8 shadow-sm"
            style={{ border: '1px solid var(--w-accent)', backgroundColor: 'var(--w-bg)' }}
          >
            <RSVPForm wedding={wedding} menuOptions={menuOptions} busRoutes={busRoutes} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
