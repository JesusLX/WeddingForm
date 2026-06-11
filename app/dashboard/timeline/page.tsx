import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import type { TimelineEvent } from '@/lib/types'
import { TimelineManager } from './TimelineManager'
import { ProgramaSettingsManager } from './ProgramaSettingsManager'

export default async function TimelinePage() {
  const { wedding } = await requireWedding<{
    event_timeline: TimelineEvent[] | null
    program_enabled: boolean
    program_custom_url: string | null
    slug: string
  }>('id, event_timeline, program_enabled, program_custom_url, slug')

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className={pageTitleClass} style={pageTitleStyle}>
          Programa del día
        </h1>
        <TimelineManager weddingId={wedding.id} initialTimeline={wedding.event_timeline ?? []} />
      </div>
      <ProgramaSettingsManager
        weddingId={wedding.id}
        slug={wedding.slug}
        initialEnabled={wedding.program_enabled ?? false}
        initialCustomUrl={wedding.program_custom_url ?? ''}
      />
    </div>
  )
}
