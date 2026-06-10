import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

/**
 * Shared boilerplate for dashboard server pages:
 * requires an authenticated user (else → /login) and an existing wedding
 * (else → /dashboard/configurar), returning both plus the supabase client.
 *
 * Usage: const { supabase, wedding } = await requireWedding('id, gallery_image_urls')
 */
export async function requireWedding<T = Record<string, unknown>>(select = 'id') {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select(select)
    .eq('user_id', user.id)
    .single<T & { id: string }>()

  if (!wedding) redirect('/dashboard/configurar')

  return { supabase, user, wedding }
}

/**
 * Requires only an authenticated user (else → /login).
 * For pages that handle the "no wedding yet" case themselves
 * (dashboard home, configurar).
 */
export async function requireUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return { supabase, user }
}
