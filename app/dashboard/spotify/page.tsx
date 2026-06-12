import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import { SpotifyManager } from './SpotifyManager'

export default async function SpotifyPage() {
  const { supabase, wedding } = await requireWedding<{ spotify_playlist_url: string | null }>(
    'id, spotify_playlist_url'
  )

  // spotify_description may not exist if migration hasn't run yet
  const { data: extra } = await supabase
    .from('weddings')
    .select('spotify_description')
    .eq('id', wedding.id)
    .single<{ spotify_description: string | null }>()

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Playlist de Spotify
      </h1>
      <SpotifyManager
        weddingId={wedding.id}
        initialUrl={wedding.spotify_playlist_url ?? ''}
        initialDescription={extra?.spotify_description ?? ''}
      />
    </div>
  )
}
