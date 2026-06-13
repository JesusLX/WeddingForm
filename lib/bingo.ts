// Pure bingo helpers — no IO. Shared by the API routes, the master view
// and the guest board so card generation and win detection stay consistent.

export type BingoCellType = 'numbers' | 'emojis' | 'photos'
export type BingoStatus = 'lobby' | 'playing' | 'paused' | 'finished'
export type BingoMode = 'manual' | 'auto'

export const CARD_SIZES = [9, 16, 25] as const
export type CardSize = (typeof CARD_SIZES)[number]

/** Grid side length for a card size (9 → 3, 16 → 4, 25 → 5). */
export function gridDim(size: number): number {
  return Math.round(Math.sqrt(size))
}

/** Fisher–Yates shuffle returning a new array. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Build the draw pool (all possible items) for a game.
 * Numbers mode derives 1..numberMax; emojis/photos use the configured items.
 */
export function buildPool(cellType: BingoCellType, items: string[], numberMax: number): string[] {
  if (cellType === 'numbers') {
    return Array.from({ length: Math.max(1, numberMax) }, (_, i) => String(i + 1))
  }
  // De-duplicate while preserving order
  return [...new Set(items.filter(Boolean))]
}

/** Pick `size` distinct items from the pool to form a card. */
export function generateCard(pool: string[], size: number): string[] {
  return shuffle(pool).slice(0, size)
}

/** Index sets for each horizontal row of a square card. */
export function rowsOf(size: number): number[][] {
  const dim = gridDim(size)
  const rows: number[][] = []
  for (let r = 0; r < dim; r++) {
    rows.push(Array.from({ length: dim }, (_, c) => r * dim + c))
  }
  return rows
}

/** True when at least one full horizontal row is marked. */
export function hasLine(markedIdx: number[], size: number): boolean {
  const marked = new Set(markedIdx)
  return rowsOf(size).some(row => row.every(i => marked.has(i)))
}

/** True when every cell of the card is marked. */
export function hasBingo(markedIdx: number[], size: number): boolean {
  return markedIdx.length >= size
}

/** Minimum pool size required for a given card size (need distinct items). */
export function minPoolFor(size: number): number {
  return size
}
