// Dashboard design tokens — single source of truth for the admin UI.
// The PUBLIC wedding page does NOT use these: it themes via CSS variables
// (--w-bg, --w-accent, --w-primary, --w-dark) injected in app/boda/[slug]/page.tsx.

export const UI = {
  /** Gold — primary actions, links, highlights */
  primary: '#C9A84C',
  /** Pale pink — borders, soft accents */
  accent: '#F4D7D7',
  /** Charcoal — headings, dark surfaces */
  dark: '#2D2D2D',
  /** Cream — page background */
  bg: '#FAF7F4',
  /** Secondary text */
  text: '#555555',
  /** Muted text / hints */
  muted: '#999999',
  /** Success */
  success: '#4CAF50',
  /** Error */
  error: '#EF5350',
} as const

// Shared class strings for common dashboard elements.
export const inputClass =
  'w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-amber-300'

export const inputStyle = {
  borderColor: UI.accent,
  backgroundColor: 'white',
  color: UI.dark,
} as const

export const cardClass = 'rounded-2xl p-5'

export const cardStyle = {
  backgroundColor: 'white',
  border: `1px solid ${UI.accent}`,
} as const

export const primaryButtonClass =
  'px-4 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50'

export const primaryButtonStyle = { backgroundColor: UI.primary } as const

export const pageTitleClass = 'text-3xl italic mb-6'

export const pageTitleStyle = {
  fontFamily: 'var(--font-playfair)',
  color: UI.dark,
} as const
