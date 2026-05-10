import { ScrollReveal } from '@/components/ScrollReveal'
import { RSVPForm } from './RSVPForm'
import type { Wedding, MenuOption } from '@/lib/types'

export function RSVPSection({
  wedding,
  menuOptions,
}: {
  wedding: Wedding
  menuOptions: MenuOption[]
}) {
  return (
    <section id="rsvp" className="py-24 px-6 bg-white">
      <div className="max-w-xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
              Confirmación
            </p>
            <h2
              className="text-4xl md:text-5xl italic mb-4"
              style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
            >
              ¿Vendrás?
            </h2>
            <div className="h-px w-16 mx-auto mb-6" style={{ backgroundColor: '#C9A84C' }} />
            <p className="text-sm" style={{ color: '#555555' }}>
              Rellena el formulario y dinos que podemos contar contigo.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="rounded-2xl p-6 md:p-8 shadow-sm"
            style={{ border: '1px solid #F4D7D7', backgroundColor: '#FAF7F4' }}
          >
            <RSVPForm wedding={wedding} menuOptions={menuOptions} />
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
