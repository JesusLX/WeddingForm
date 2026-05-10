export interface TimelineEvent {
  time: string
  label: string
}

export interface FaqItem {
  q: string
  a: string
}

export interface Wedding {
  id: string
  user_id: string
  slug: string
  partner_1: string
  partner_2: string
  wedding_date: string
  ceremony_time: string | null
  ceremony_venue: string | null
  ceremony_address: string | null
  ceremony_maps_url: string | null
  reception_time: string | null
  reception_venue: string | null
  reception_address: string | null
  reception_maps_url: string | null
  same_venue: boolean
  our_story: string | null
  cover_image_url: string | null
  gallery_image_urls: string[]
  event_timeline: TimelineEvent[]
  dress_code: string | null
  dress_code_notes: string | null
  rsvp_deadline: string | null
  bank_iban: string | null
  bank_holder: string | null
  bank_concept: string | null
  gifts_text: string | null
  spotify_playlist_url: string | null
  faq: FaqItem[]
  google_sheet_id: string | null
  bus_enabled: boolean
  is_published: boolean
  created_at: string
  updated_at: string
}

export interface MenuOption {
  id: string
  wedding_id: string
  name: string
  emoji: string
  sort_order: number
}

export interface RsvpResponse {
  id: string
  wedding_id: string
  guest_name: string
  attendance: boolean
  adults_count: number
  has_children: boolean
  children_count: number
  children_want_menu: boolean
  menu_option_id: string | null
  needs_bus: boolean
  allergies: string | null
  song_request: string | null
  message: string | null
  submitted_at: string
  menu_option?: MenuOption
}

export interface ExpectedGuest {
  id: string
  wedding_id: string
  name: string
  email: string | null
  phone: string | null
  rsvp_response_id: string | null
  created_at: string
  rsvp_response?: RsvpResponse
}

export interface RsvpFormData {
  guest_name: string
  attendance: boolean
  adults_count: number
  has_children: boolean
  children_count: number
  children_want_menu: boolean
  menu_option_id: string
  needs_bus: boolean
  allergies: string
  song_request: string
  message: string
}
