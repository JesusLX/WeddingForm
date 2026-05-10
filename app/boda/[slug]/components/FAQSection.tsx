'use client'
import { useState } from 'react'
import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding, FaqItem } from '@/lib/types'

function FaqAccordion({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className="border-b last:border-b-0 py-4 cursor-pointer"
      style={{ borderColor: '#F4D7D7' }}
      onClick={() => setOpen(!open)}
    >
      <div className="flex justify-between items-center gap-4">
        <p className="font-medium text-left" style={{ color: '#2D2D2D' }}>{item.q}</p>
        <svg
          className="w-5 h-5 flex-shrink-0 transition-transform duration-300"
          style={{ color: '#C9A84C', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {open && (
        <p className="mt-3 text-sm leading-relaxed text-left" style={{ color: '#555555' }}>
          {item.a}
        </p>
      )}
    </div>
  )
}

export function FAQSection({ wedding }: { wedding: Wedding }) {
  if (!wedding.faq || wedding.faq.length === 0) return null

  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#FAF7F4' }}>
      <div className="max-w-2xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
              Dudas frecuentes
            </p>
            <h2
              className="text-4xl md:text-5xl italic"
              style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
            >
              Preguntas frecuentes
            </h2>
            <div className="h-px w-16 mx-auto mt-6" style={{ backgroundColor: '#C9A84C' }} />
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div
            className="rounded-2xl p-6"
            style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
          >
            {wedding.faq.map((item, i) => (
              <FaqAccordion key={i} item={item} />
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
