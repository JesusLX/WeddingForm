'use client'
import { useState } from 'react'
import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function BankInfoSection({ wedding }: { wedding: Wedding }) {
  const [copied, setCopied] = useState(false)

  const hasBank = wedding.bank_iban || wedding.gifts_text
  if (!hasBank) return null

  function copyIban() {
    if (!wedding.bank_iban) return
    navigator.clipboard.writeText(wedding.bank_iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-24 px-6" style={{ backgroundColor: '#F9EEE8' }}>
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: '#C9A84C' }}>
            Regalos
          </p>
          <h2
            className="text-4xl md:text-5xl italic mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
          >
            Si quieres hacernos un regalo
          </h2>
          <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: '#C9A84C' }} />

          {wedding.gifts_text && (
            <p className="text-base leading-relaxed mb-8" style={{ color: '#555555' }}>
              {wedding.gifts_text}
            </p>
          )}

          {wedding.bank_iban && (
            <div
              className="rounded-2xl p-6 inline-block w-full max-w-md"
              style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}
            >
              {wedding.bank_holder && (
                <p className="text-sm uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
                  Titular
                </p>
              )}
              {wedding.bank_holder && (
                <p className="font-semibold text-lg mb-4" style={{ color: '#2D2D2D' }}>
                  {wedding.bank_holder}
                </p>
              )}

              <p className="text-sm uppercase tracking-widest mb-1" style={{ color: '#C9A84C' }}>
                IBAN
              </p>
              <p className="font-mono text-base mb-1" style={{ color: '#2D2D2D' }}>
                {wedding.bank_iban}
              </p>

              {wedding.bank_concept && (
                <>
                  <p className="text-sm uppercase tracking-widest mt-4 mb-1" style={{ color: '#C9A84C' }}>
                    Concepto
                  </p>
                  <p className="text-sm" style={{ color: '#555555' }}>{wedding.bank_concept}</p>
                </>
              )}

              <button
                onClick={copyIban}
                className="mt-5 flex items-center gap-2 mx-auto px-5 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
                style={{ backgroundColor: copied ? '#4CAF50' : '#C9A84C', color: 'white' }}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar IBAN
                  </>
                )}
              </button>
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
