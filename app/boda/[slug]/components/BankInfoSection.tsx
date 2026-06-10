'use client'
import { useState } from 'react'
import { ScrollReveal } from '@/components/ScrollReveal'
import type { Wedding } from '@/lib/types'

export function BankInfoSection({ wedding }: { wedding: Wedding }) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const hasBank = wedding.bank_iban || wedding.gifts_text
  if (!hasBank) return null

  function copyIban() {
    if (!wedding.bank_iban) return
    navigator.clipboard.writeText(wedding.bank_iban)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--w-bg)' }}>
      <div className="max-w-2xl mx-auto text-center">
        <ScrollReveal>
          <p className="uppercase tracking-[0.3em] text-xs mb-4" style={{ color: 'var(--w-primary)' }}>
            Regalos
          </p>
          <h2
            className="text-4xl md:text-5xl italic mb-6"
            style={{ fontFamily: 'var(--font-playfair)', color: 'var(--w-dark)' }}
          >
            Si quieres hacernos un regalo
          </h2>
          <div className="h-px w-16 mx-auto mb-8" style={{ backgroundColor: 'var(--w-primary)' }} />

          {wedding.gifts_text && (
            <p className="text-base leading-relaxed mb-8" style={{ color: '#555555' }}>
              {wedding.gifts_text}
            </p>
          )}

          {wedding.bank_iban && (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => setOpen(prev => !prev)}
                className="flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all hover:opacity-80"
                style={{
                  border: '1px solid var(--w-primary)',
                  color: open ? 'white' : 'var(--w-primary)',
                  backgroundColor: open ? 'var(--w-primary)' : 'transparent',
                }}
              >
                Ver datos bancarios
                <svg
                  className="w-4 h-4 transition-transform duration-300"
                  style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {open && (
                <div
                  className="rounded-2xl p-6 w-full max-w-md text-left"
                  style={{ backgroundColor: 'white', border: '1px solid var(--w-accent)' }}
                >
                  {wedding.bank_holder && (
                    <>
                      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--w-primary)' }}>Titular</p>
                      <p className="font-semibold text-lg mb-4" style={{ color: 'var(--w-dark)' }}>{wedding.bank_holder}</p>
                    </>
                  )}

                  <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--w-primary)' }}>IBAN</p>
                  <p className="font-mono text-base mb-1" style={{ color: 'var(--w-dark)' }}>{wedding.bank_iban}</p>

                  {wedding.bank_concept && (
                    <>
                      <p className="text-xs uppercase tracking-widest mt-4 mb-1" style={{ color: 'var(--w-primary)' }}>Concepto</p>
                      <p className="text-sm" style={{ color: '#555555' }}>{wedding.bank_concept}</p>
                    </>
                  )}

                  <button
                    onClick={copyIban}
                    className="mt-5 flex items-center gap-2 mx-auto px-5 py-2 rounded-full text-sm font-medium transition-all hover:opacity-80"
                    style={{ backgroundColor: copied ? '#4CAF50' : 'var(--w-primary)', color: 'white' }}
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
            </div>
          )}
        </ScrollReveal>
      </div>
    </section>
  )
}
