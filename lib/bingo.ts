// Pure bingo helpers — no IO. Shared by the API routes, the master view
// and the guest board so card generation and win detection stay consistent.

export type BingoCellType = 'numbers' | 'emojis' | 'photos'
export type BingoStatus = 'lobby' | 'playing' | 'paused' | 'finished'
export type BingoMode = 'manual' | 'auto'

export const CARD_SIZES = [9, 16, 25] as const
export type CardSize = (typeof CARD_SIZES)[number]

// Spanish bingo: 3 rows × 9 cols, 15 filled cells per card, 90 balls (1-90)
export const SPANISH_CARD_SIZE = 27  // total cells (3×9), nulls = blank

/** Grid side length for a square card size (9 → 3, 16 → 4, 25 → 5). */
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
 * Build the draw pool for a game.
 * Numbers mode always uses 1..90 (Spanish bingo). Emojis/photos use configured items.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function buildPool(cellType: BingoCellType, items: string[], _numberMax: number): string[] {
  if (cellType === 'numbers') {
    return Array.from({ length: 90 }, (_, i) => String(i + 1))
  }
  return [...new Set(items.filter(Boolean))]
}

/** Pick `size` distinct items from the pool to form a square-grid card. */
export function generateCard(pool: string[], size: number): string[] {
  return shuffle(pool).slice(0, size)
}

// Decade range for column col (0-8) on a Spanish bingo card.
// Col 0 = 1-9, cols 1-7 = decade×10 … decade×10+9, col 8 = 80-90.
function colRange(col: number): [number, number] {
  if (col === 0) return [1, 9]
  if (col === 8) return [80, 90]
  return [col * 10, col * 10 + 9]
}

/**
 * Generate a standard Spanish bingo card.
 * Returns a 27-element (string | null)[] in row-major order (row0col0 … row2col8).
 * null means blank (no number in that cell).
 * Each row has exactly 5 numbers; each column has 1-3 numbers from its decade range,
 * sorted ascending top-to-bottom.
 */
export function generateSpanishCard(): (string | null)[] {
  while (true) {
    // For each row, randomly choose 5 of 9 columns to fill.
    const mask: boolean[][] = Array.from({ length: 3 }, () => {
      const filled = new Set(shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, 5))
      return Array.from({ length: 9 }, (_, c) => filled.has(c))
    })

    // Reject cards where any column is completely empty (max is 3 by construction).
    const colCounts = Array.from({ length: 9 }, (_, c) =>
      mask.reduce((n, row) => n + (row[c] ? 1 : 0), 0)
    )
    if (colCounts.some(c => c === 0)) continue

    // Fill numbers: pick colCounts[c] values from the decade range, sorted ascending.
    const grid: (string | null)[][] = Array.from({ length: 3 }, () => new Array(9).fill(null))
    for (let col = 0; col < 9; col++) {
      const [min, max] = colRange(col)
      const pool = Array.from({ length: max - min + 1 }, (_, i) => String(min + i))
      const nums = shuffle(pool).slice(0, colCounts[col]).sort((a, b) => Number(a) - Number(b))
      let ni = 0
      for (let row = 0; row < 3; row++) {
        if (mask[row][col]) grid[row][col] = nums[ni++]
      }
    }
    return grid.flat()
  }
}

/** True when at least one complete row of a Spanish card is fully marked. */
export function hasSpanishLine(markedIdx: number[], card: (string | null)[]): boolean {
  const marked = new Set(markedIdx)
  for (let row = 0; row < 3; row++) {
    let complete = true
    let hasAny = false
    for (let col = 0; col < 9; col++) {
      const idx = row * 9 + col
      if (card[idx] !== null) {
        hasAny = true
        if (!marked.has(idx)) { complete = false; break }
      }
    }
    if (hasAny && complete) return true
  }
  return false
}

/** True when every filled cell of a Spanish card is marked. */
export function hasSpanishBingo(markedIdx: number[], card: (string | null)[]): boolean {
  const totalFilled = card.filter(c => c !== null).length
  return markedIdx.length >= totalFilled
}

/**
 * Multi-card variants: card is a flat (string|null)[] of N×SPANISH_CARD_SIZE.
 * "Línea" fires when any complete row exists in ANY card.
 * "Bingo" fires when all 15 filled cells of ANY single card are marked.
 */
export function hasSpanishLineAny(markedIdx: number[], card: (string | null)[]): boolean {
  const n = Math.floor(card.length / SPANISH_CARD_SIZE)
  for (let c = 0; c < n; c++) {
    const offset = c * SPANISH_CARD_SIZE
    const localMarked = markedIdx.filter(i => i >= offset && i < offset + SPANISH_CARD_SIZE).map(i => i - offset)
    if (hasSpanishLine(localMarked, card.slice(offset, offset + SPANISH_CARD_SIZE))) return true
  }
  return false
}

export function hasSpanishBingoAny(markedIdx: number[], card: (string | null)[]): boolean {
  const n = Math.floor(card.length / SPANISH_CARD_SIZE)
  for (let c = 0; c < n; c++) {
    const offset = c * SPANISH_CARD_SIZE
    const localMarked = markedIdx.filter(i => i >= offset && i < offset + SPANISH_CARD_SIZE).map(i => i - offset)
    if (hasSpanishBingo(localMarked, card.slice(offset, offset + SPANISH_CARD_SIZE))) return true
  }
  return false
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

/** True when at least one full horizontal row is marked (square grid). */
export function hasLine(markedIdx: number[], size: number): boolean {
  const marked = new Set(markedIdx)
  return rowsOf(size).some(row => row.every(i => marked.has(i)))
}

/** True when every cell of the card is marked (square grid). */
export function hasBingo(markedIdx: number[], size: number): boolean {
  return markedIdx.length >= size
}

/** Minimum pool size required for a given card size (need distinct items). */
export function minPoolFor(size: number): number {
  return size
}
