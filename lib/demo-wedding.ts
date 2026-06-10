import type { Wedding, MenuOption, BusRoute } from './types'

// Fixed UUID for the demo wedding: /api/rsvp short-circuits it so
// visitors can try the form without writing to the database.
export const DEMO_WEDDING_ID = '00000000-0000-4000-8000-0000000de302'

// Always next year so the countdown never hits zero
const demoDate = `${new Date().getFullYear() + 1}-09-12`

export const demoWedding: Wedding = {
  id: DEMO_WEDDING_ID,
  user_id: 'demo',
  slug: 'demo',
  partner_1: 'María',
  partner_2: 'Pedro',
  wedding_date: demoDate,
  ceremony_time: '12:30',
  ceremony_venue: 'Catedral de Sevilla',
  ceremony_address: 'Av. de la Constitución, s/n, 41004 Sevilla',
  ceremony_maps_url: 'https://www.google.com/maps?q=Catedral+de+Sevilla',
  reception_time: '14:30',
  reception_venue: 'Hacienda Los Naranjos',
  reception_address: 'Ctra. de Utrera, km 5, Sevilla',
  reception_maps_url: 'https://www.google.com/maps?q=Hacienda+Los+Naranjos+Sevilla',
  same_venue: false,
  our_story:
    'Nos conocimos un verano en la feria, entre farolillos y rebujito. Diez años, dos mudanzas y un perro después, seguimos riéndonos de aquel primer baile torpe. Ahora queremos celebrar el siguiente capítulo con las personas que más queremos: vosotros.',
  cover_image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1600&q=80',
  gallery_image_urls: [
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
    'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=800&q=80',
  ],
  event_timeline: [
    { time: '12:30', label: 'Ceremonia', icon: '⛪' },
    { time: '14:30', label: 'Cóctel de bienvenida', icon: '🥂' },
    { time: '16:00', label: 'Banquete', icon: '🍽️' },
    { time: '19:00', label: 'Primer baile', icon: '💃' },
    { time: '20:00', label: 'Barra libre y fiesta', icon: '🎉' },
    { time: '01:00', label: 'Recena', icon: '🌭' },
  ],
  dress_code: 'Formal / Cocktail',
  dress_code_notes: 'Evitad el blanco (reservado para la novia). Los tonos pastel son bienvenidos.',
  rsvp_deadline: null,
  bank_iban: 'ES00 1234 5678 9012 3456 7890',
  bank_holder: 'María y Pedro',
  bank_concept: 'Boda María y Pedro',
  gifts_text:
    'Vuestra compañía en un día tan especial es el mejor regalo que podemos recibir. Si además queréis tener un detalle con nosotros, podréis hacerlo el mismo día de la boda o a través de la cuenta que encontraréis aquí debajo.',
  spotify_playlist_url: 'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',
  spotify_description: 'Las canciones que nos han acompañado estos años. ¡Pide la tuya en el formulario!',
  faq: [
    { q: '¿Puedo llevar acompañante?', a: 'Claro, indícalo en el formulario de confirmación añadiendo a tus acompañantes.' },
    { q: '¿Habrá opciones vegetarianas?', a: 'Sí, elige el menú vegetariano al confirmar tu asistencia.' },
    { q: '¿Hay aparcamiento en la hacienda?', a: 'Sí, la hacienda cuenta con aparcamiento gratuito. También habrá autobuses de ida y vuelta.' },
    { q: '¿Pueden venir niños?', a: '¡Por supuesto! Habrá menú infantil y animación para los más pequeños.' },
  ],
  google_sheet_id: null,
  bus_enabled: true,
  is_published: true,
  color_bg: '#FAF7F4',
  color_accent: '#F4D7D7',
  color_primary: '#C9A84C',
  color_dark: '#2D2D2D',
  tables_count: 10,
  tables_min_guests: 8,
  tables_max_guests: 10,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const demoMenuOptions: MenuOption[] = [
  { id: 'demo-menu-1', wedding_id: DEMO_WEDDING_ID, name: 'Carne', emoji: '🥩', sort_order: 0 },
  { id: 'demo-menu-2', wedding_id: DEMO_WEDDING_ID, name: 'Pescado', emoji: '🐟', sort_order: 1 },
  { id: 'demo-menu-3', wedding_id: DEMO_WEDDING_ID, name: 'Vegetariano', emoji: '🥗', sort_order: 2 },
  { id: 'demo-menu-4', wedding_id: DEMO_WEDDING_ID, name: 'Infantil', emoji: '🍕', sort_order: 3 },
]

export const demoBusRoutes: BusRoute[] = [
  { id: 'demo-bus-1', wedding_id: DEMO_WEDDING_ID, direction: 'outbound', label: 'Ida 11:30 — Plaza Nueva', sort_order: 0 },
  { id: 'demo-bus-2', wedding_id: DEMO_WEDDING_ID, direction: 'outbound', label: 'Ida 12:00 — Estación Santa Justa', sort_order: 1 },
  { id: 'demo-bus-3', wedding_id: DEMO_WEDDING_ID, direction: 'return', label: 'Vuelta 21:00', sort_order: 0 },
  { id: 'demo-bus-4', wedding_id: DEMO_WEDDING_ID, direction: 'return', label: 'Vuelta 00:30', sort_order: 1 },
  { id: 'demo-bus-5', wedding_id: DEMO_WEDDING_ID, direction: 'return', label: 'Vuelta 03:00 (fin de fiesta)', sort_order: 2 },
]
