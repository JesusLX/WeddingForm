import { requireWedding } from '@/lib/dashboard'
import { pageTitleClass, pageTitleStyle } from '@/lib/ui'
import type { BingoGame } from '@/lib/types'
import { BingoManager } from './BingoManager'

export default async function BingoPage() {
  const { supabase, wedding } = await requireWedding<{ slug: string }>('id, slug')

  let { data: game } = await supabase
    .from('bingo_games')
    .select('*')
    .eq('wedding_id', wedding.id)
    .single<BingoGame>()

  // Lazily create the game row the first time the couple opens this page.
  if (!game) {
    const { data: created } = await supabase
      .from('bingo_games')
      .insert({ wedding_id: wedding.id })
      .select('*')
      .single<BingoGame>()
    game = created
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={pageTitleClass} style={pageTitleStyle}>
        Bingo
      </h1>
      {game ? (
        <BingoManager initialGame={game} weddingSlug={wedding.slug} />
      ) : (
        <p className="text-sm" style={{ color: '#888' }}>
          No se pudo cargar el juego. Recarga la página.
        </p>
      )}
    </div>
  )
}
