import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { SheetsManager } from './SheetsManager'

export default async function SheetsPage() {
  const { wedding } = await requireWedding<{ google_sheet_id: string | null }>(
    'id, google_sheet_id'
  )

  return (
    <div className="max-w-xl">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Conectar Google Sheets
      </h1>
      <SheetsManager weddingId={wedding.id} initialSheetId={wedding.google_sheet_id ?? ''} />
    </div>
  )
}
