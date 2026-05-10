import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { ConfigForm } from './ConfigForm'

export default async function ConfigurarPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl">
      <h1
        className="text-3xl italic mb-6"
        style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}
      >
        Configurar mi boda
      </h1>
      <ConfigForm wedding={wedding} userId={user.id} />
    </div>
  )
}
