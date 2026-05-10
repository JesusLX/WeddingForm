import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { MenuManager } from './MenuManager'

export default async function MenuPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) redirect('/dashboard/configurar')

  const { data: options } = await supabase
    .from('menu_options').select('*').eq('wedding_id', wedding.id).order('sort_order')

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Opciones de menú
      </h1>
      <MenuManager weddingId={wedding.id} initialOptions={options ?? []} />
    </div>
  )
}
