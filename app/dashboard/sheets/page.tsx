import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { SheetsManager } from './SheetsManager'

export default async function SheetsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id, google_sheet_id').eq('user_id', user.id).single()
  if (!wedding) redirect('/dashboard/configurar')

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Conectar Google Sheets
      </h1>
      <SheetsManager weddingId={wedding.id} initialSheetId={wedding.google_sheet_id ?? ''} />
    </div>
  )
}
