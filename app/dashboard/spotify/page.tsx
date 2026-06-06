import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { SpotifyManager } from './SpotifyManager'

export default async function SpotifyPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: wedding } = await supabase
    .from('weddings')
    .select('id, spotify_playlist_url')
    .eq('user_id', user.id)
    .single()
  if (!wedding) redirect('/dashboard/configurar')

  // spotify_description may not exist if migration hasn't run yet
  const { data: extra } = await supabase
    .from('weddings')
    .select('spotify_description')
    .eq('id', wedding.id)
    .single()

  return (
    <div className="max-w-xl">
      <h1 className="text-3xl italic mb-6" style={{ fontFamily: 'var(--font-playfair)', color: '#2D2D2D' }}>
        Playlist de Spotify
      </h1>
      <SpotifyManager
        weddingId={wedding.id}
        initialUrl={wedding.spotify_playlist_url ?? ''}
        initialDescription={(extra as any)?.spotify_description ?? ''}
      />
    </div>
  )
}
