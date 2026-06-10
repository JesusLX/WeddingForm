import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import type { FaqItem } from '@/lib/types'
import { FaqManager } from './FaqManager'

export default async function FaqPage() {
  const { wedding } = await requireWedding<{ faq: FaqItem[] | null }>(
    'id, faq'
  )

  return (
    <div className="max-w-xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Preguntas frecuentes
      </h1>
      <FaqManager weddingId={wedding.id} initialFaq={wedding.faq ?? []} />
    </div>
  )
}
