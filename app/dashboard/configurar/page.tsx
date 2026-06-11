import { requireUser } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle, UI } from '@/lib/ui'
import { ConfigForm } from './ConfigForm'
import { SpotifyManager } from '../spotify/SpotifyManager'
import { SheetsManager } from '../sheets/SheetsManager'

export default async function ConfigurarPage() {
  const { supabase, user } = await requireUser()

  const { data: wedding } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <section>
        <h1 className={pageTitleClass} style={pageTitleStyle}>
          Configurar mi boda
        </h1>
        <ConfigForm wedding={wedding} userId={user.id} />
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: UI.dark }}>Playlist de Spotify</h2>
        <p className="text-sm mb-4" style={{ color: UI.muted }}>
          Comparte vuestra música y permite que los invitados pidan canciones.
        </p>
        <SpotifyManager
          weddingId={wedding?.id ?? ''}
          initialUrl={wedding?.spotify_playlist_url ?? ''}
          initialDescription={wedding?.spotify_description ?? ''}
        />
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1" style={{ color: UI.dark }}>Google Sheets</h2>
        <p className="text-sm mb-4" style={{ color: UI.muted }}>
          Sincroniza las confirmaciones con una hoja de cálculo en tiempo real.
        </p>
        <SheetsManager
          weddingId={wedding?.id ?? ''}
          initialSheetId={wedding?.google_sheet_id ?? ''}
        />
      </section>
    </div>
  )
}
