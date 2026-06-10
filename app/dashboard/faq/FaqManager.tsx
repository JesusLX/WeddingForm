'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { FaqItem } from '@/lib/types'

export function FaqManager({
  weddingId,
  initialFaq,
}: {
  weddingId: string
  initialFaq: FaqItem[]
}) {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaq)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editQ, setEditQ] = useState('')
  const [editA, setEditA] = useState('')
  const supabase = createClient()

  async function saveFaq(updated: FaqItem[]) {
    setSaving(true)
    const { error } = await supabase
      .from('weddings')
      .update({ faq: updated })
      .eq('id', weddingId)
    setSaving(false)
    if (error) {
      setMessage('Error al guardar')
    } else {
      setMessage('¡Guardado!')
    }
    setTimeout(() => setMessage(''), 2000)
  }

  function addFaq() {
    if (!question.trim() || !answer.trim()) return
    const updated = [...faqs, { q: question.trim(), a: answer.trim() }]
    setFaqs(updated)
    saveFaq(updated)
    setQuestion('')
    setAnswer('')
  }

  function startEdit(i: number) {
    setEditingIdx(i)
    setEditQ(faqs[i].q)
    setEditA(faqs[i].a)
  }

  function saveEdit() {
    if (editingIdx === null || !editQ.trim() || !editA.trim()) return
    const updated = faqs.map((item, i) =>
      i === editingIdx ? { q: editQ.trim(), a: editA.trim() } : item
    )
    setFaqs(updated)
    saveFaq(updated)
    setEditingIdx(null)
  }

  function removeItem(i: number) {
    const updated = faqs.filter((_, idx) => idx !== i)
    setFaqs(updated)
    saveFaq(updated)
  }

  function moveUp(i: number) {
    if (i === 0) return
    const updated = [...faqs]
    ;[updated[i - 1], updated[i]] = [updated[i], updated[i - 1]]
    setFaqs(updated)
    saveFaq(updated)
  }

  function moveDown(i: number) {
    if (i === faqs.length - 1) return
    const updated = [...faqs]
    ;[updated[i], updated[i + 1]] = [updated[i + 1], updated[i]]
    setFaqs(updated)
    saveFaq(updated)
  }

  const inputClass = 'px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300 w-full'
  const inputStyle = { borderColor: '#F4D7D7', backgroundColor: 'white', color: '#2D2D2D' }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 space-y-4" style={{ backgroundColor: 'white', border: '1px solid #F4D7D7' }}>
        <p className="text-sm" style={{ color: '#555' }}>
          Añade las preguntas que tus invitados suelen hacer. Aparecerán en tu página de boda.
        </p>

        <div className="space-y-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Pregunta, ej: ¿Hay aparcamiento?"
            className={inputClass}
            style={inputStyle}
            onKeyDown={(e) => e.key === 'Enter' && addFaq()}
          />
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Respuesta"
            rows={2}
            className={inputClass}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
          <button
            onClick={addFaq}
            disabled={saving || !question.trim() || !answer.trim()}
            className="px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 w-full"
            style={{ backgroundColor: '#C9A84C' }}
          >
            Añadir pregunta
          </button>
        </div>

        {faqs.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: '#888' }}>Sin preguntas todavía</p>
        ) : (
          <ul className="space-y-2">
            {faqs.map((item, i) => (
              <li
                key={i}
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#F9EEE8' }}
              >
                {editingIdx === i ? (
                  <div className="space-y-2">
                    <input
                      value={editQ}
                      onChange={(e) => setEditQ(e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      autoFocus
                      onKeyDown={(e) => e.key === 'Escape' && setEditingIdx(null)}
                    />
                    <textarea
                      value={editA}
                      onChange={(e) => setEditA(e.target.value)}
                      rows={2}
                      className={inputClass}
                      style={{ ...inputStyle, resize: 'vertical' }}
                      onKeyDown={(e) => e.key === 'Escape' && setEditingIdx(null)}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ backgroundColor: '#4CAF50' }}
                      >
                        ✓ Guardar
                      </button>
                      <button
                        onClick={() => setEditingIdx(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium"
                        style={{ color: '#888' }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style={{ color: '#2D2D2D' }}>{item.q}</p>
                      <p className="text-sm mt-0.5" style={{ color: '#555' }}>{item.a}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0 mt-0.5">
                      <button
                        onClick={() => moveUp(i)}
                        disabled={i === 0}
                        className="text-xs px-1.5 py-1 rounded hover:opacity-70 disabled:opacity-30"
                        style={{ color: '#888' }}
                        title="Subir"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveDown(i)}
                        disabled={i === faqs.length - 1}
                        className="text-xs px-1.5 py-1 rounded hover:opacity-70 disabled:opacity-30"
                        style={{ color: '#888' }}
                        title="Bajar"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => startEdit(i)}
                        className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                        style={{ color: '#C9A84C', backgroundColor: '#C9A84C22' }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removeItem(i)}
                        className="text-xs px-2 py-1 rounded-lg hover:opacity-70"
                        style={{ color: '#EF5350', backgroundColor: '#EF535022' }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {message && (
          <p className="text-sm text-center" style={{ color: message.startsWith('Error') ? '#EF5350' : '#4CAF50' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  )
}
