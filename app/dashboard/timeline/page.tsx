import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import type { TimelineEvent } from '@/lib/types'
import { TimelineManager } from './TimelineManager'

export default async function TimelinePage() {
  const { wedding } = await requireWedding<{ event_timeline: TimelineEvent[] | null }>(
    'id, event_timeline'
  )

  return (
    <div className="max-w-xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Programa del día
      </h1>
      <TimelineManager weddingId={wedding.id} initialTimeline={wedding.event_timeline ?? []} />
    </div>
  )
}
