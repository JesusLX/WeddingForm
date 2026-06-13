-- Wedding RSVP SaaS - Schema SQL
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- WEDDINGS
-- ============================================================
CREATE TABLE weddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  partner_1 TEXT NOT NULL,
  partner_2 TEXT NOT NULL,
  wedding_date DATE NOT NULL,
  ceremony_time TIME,
  ceremony_venue TEXT,
  ceremony_address TEXT,
  ceremony_maps_url TEXT,
  reception_time TIME,
  reception_venue TEXT,
  reception_address TEXT,
  reception_maps_url TEXT,
  same_venue BOOLEAN DEFAULT false,
  our_story TEXT,
  cover_image_url TEXT,
  gallery_image_urls TEXT[] DEFAULT '{}',
  event_timeline JSONB DEFAULT '[]',
  dress_code TEXT,
  dress_code_notes TEXT,
  rsvp_deadline DATE,
  bank_iban TEXT,
  bank_holder TEXT,
  bank_concept TEXT,
  gifts_text TEXT,
  spotify_playlist_url TEXT,
  spotify_description TEXT,
  faq JSONB DEFAULT '[]',
  google_sheet_id TEXT,
  bus_enabled BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MENU OPTIONS
-- ============================================================
CREATE TABLE menu_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '🍽️',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- EXPECTED GUESTS (lista de invitados que la pareja sube)
-- ============================================================
CREATE TABLE expected_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rsvp_response_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RSVP RESPONSES
-- ============================================================
CREATE TABLE rsvp_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  guest_name TEXT NOT NULL,
  attendance BOOLEAN NOT NULL,
  adults_count INT DEFAULT 1,
  adult_names TEXT[] DEFAULT '{}',
  adult_menus TEXT[] DEFAULT '{}',
  has_children BOOLEAN DEFAULT false,
  children_count INT DEFAULT 0,
  children_names TEXT[] DEFAULT '{}',
  children_menus TEXT[] DEFAULT '{}',
  bus_option TEXT DEFAULT 'none',
  allergies TEXT,
  song_request TEXT,
  message TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Migration (run if table already exists):
-- ALTER TABLE rsvp_responses
--   ADD COLUMN IF NOT EXISTS adult_names TEXT[] DEFAULT '{}',
--   ADD COLUMN IF NOT EXISTS children_names TEXT[] DEFAULT '{}';

-- FK from expected_guests to rsvp_responses (added after both tables exist)
ALTER TABLE expected_guests
  ADD CONSTRAINT fk_rsvp_response
  FOREIGN KEY (rsvp_response_id)
  REFERENCES rsvp_responses(id)
  ON DELETE SET NULL;

-- Per-person link: stores the guest_key (e.g. "{rsvpId}_adult_0") for individual linking
ALTER TABLE expected_guests ADD COLUMN IF NOT EXISTS guest_key TEXT;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE weddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvp_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expected_guests ENABLE ROW LEVEL SECURITY;

-- Weddings: owner can CRUD, anyone can SELECT published
CREATE POLICY "owner_all" ON weddings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "public_read" ON weddings FOR SELECT USING (is_published = true);

-- Menu options: owner via wedding, public read published weddings
CREATE POLICY "owner_all" ON menu_options FOR ALL
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "public_read" ON menu_options FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE is_published = true));

-- RSVP responses: owner reads/updates/deletes, anyone can INSERT
CREATE POLICY "owner_read" ON rsvp_responses FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "owner_update" ON rsvp_responses FOR UPDATE
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "owner_delete" ON rsvp_responses FOR DELETE
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "public_insert" ON rsvp_responses FOR INSERT WITH CHECK (true);

-- Expected guests: owner only
CREATE POLICY "owner_all" ON expected_guests FOR ALL
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));

-- ============================================================
-- SEATING ARRANGEMENT
-- ============================================================

-- Table config columns on weddings
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS tables_count INT DEFAULT 10,
  ADD COLUMN IF NOT EXISTS tables_min_guests INT DEFAULT 8,
  ADD COLUMN IF NOT EXISTS tables_max_guests INT DEFAULT 10;

-- Relationships between individual guests
CREATE TABLE IF NOT EXISTS guest_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  guest_a_key TEXT NOT NULL,
  guest_b_key TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('TOGETHER', 'KNOWS', 'APART')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(wedding_id, guest_a_key, guest_b_key)
);

-- Computed seat assignments (overwritten on each auto-assign)
CREATE TABLE IF NOT EXISTS table_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  table_number INT NOT NULL,
  guest_key TEXT NOT NULL,
  UNIQUE(wedding_id, guest_key)
);

ALTER TABLE guest_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_all" ON guest_relationships FOR ALL
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "owner_all" ON table_assignments FOR ALL
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));

-- ============================================================
-- PALETTE COLORS
-- ============================================================
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS color_bg TEXT DEFAULT '#FAF7F4';
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS color_accent TEXT DEFAULT '#F4D7D7';
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS color_primary TEXT DEFAULT '#C9A84C';
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS color_dark TEXT DEFAULT '#2D2D2D';

-- ============================================================
-- BUS ROUTES (configurable per-wedding bus options)
-- ============================================================
CREATE TABLE IF NOT EXISTS bus_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'return')),
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0
);
ALTER TABLE bus_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_all" ON bus_routes FOR ALL
  USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
CREATE POLICY "public_read" ON bus_routes FOR SELECT
  USING (wedding_id IN (SELECT id FROM weddings WHERE is_published = true));

-- Per-person bus selections on rsvp_responses
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS bus_outbound TEXT;
ALTER TABLE rsvp_responses ADD COLUMN IF NOT EXISTS bus_return TEXT;

-- ============================================================
-- FEATURE: PROGRAMA DEL DÍA PÚBLICO POR QR
-- ============================================================
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS program_enabled BOOLEAN DEFAULT false;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS program_custom_url TEXT;

-- ============================================================
-- FEATURE: RECORDATORIOS POR EMAIL
-- ============================================================
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS reminder_enabled BOOLEAN DEFAULT false;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS reminder_days_before INT DEFAULT 7;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS reminder_last_sent TIMESTAMPTZ;

-- ============================================================
-- FEATURE: MÚLTIPLES EVENTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS wedding_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME,
  venue TEXT,
  address TEXT,
  maps_url TEXT,
  description TEXT,
  sort_order INT DEFAULT 0,
  access_key UUID DEFAULT gen_random_uuid() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Migration for existing installs:
ALTER TABLE wedding_events ADD COLUMN IF NOT EXISTS access_key UUID DEFAULT gen_random_uuid();
ALTER TABLE wedding_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'wedding_events' AND policyname = 'owner_all'
  ) THEN
    CREATE POLICY "owner_all" ON wedding_events FOR ALL
      USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
  END IF;
END $$;
-- Public pages read events via the admin client (server only); the anon key
-- must NOT read this table or it would leak access/edit keys of every event.
DROP POLICY IF EXISTS "public_read" ON wedding_events;

-- FEATURE: EVENTOS SECRETOS (despedidas, sorpresas)
-- La pareja solo ve su etiqueta privada y los enlaces; los detalles los
-- gestiona un organizador externo mediante edit_key (sin login, vía API).
ALTER TABLE wedding_events ADD COLUMN IF NOT EXISTS is_secret BOOLEAN DEFAULT false;
ALTER TABLE wedding_events ADD COLUMN IF NOT EXISTS edit_key UUID DEFAULT gen_random_uuid();
ALTER TABLE wedding_events ADD COLUMN IF NOT EXISTS secret_label TEXT;
ALTER TABLE wedding_events ALTER COLUMN event_date DROP NOT NULL;

-- ============================================================
-- FEATURE: GALERÍA COLABORATIVA DE INVITADOS
-- ============================================================
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS collab_gallery_enabled BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL,
  photo_url TEXT NOT NULL,
  guest_name TEXT,
  caption TEXT,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE guest_photos ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_photos' AND policyname = 'owner_all'
  ) THEN
    CREATE POLICY "owner_all" ON guest_photos FOR ALL
      USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_photos' AND policyname = 'public_insert'
  ) THEN
    CREATE POLICY "public_insert" ON guest_photos FOR INSERT
      WITH CHECK (wedding_id IN (SELECT id FROM weddings WHERE is_published = true));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'guest_photos' AND policyname = 'public_read_approved'
  ) THEN
    CREATE POLICY "public_read_approved" ON guest_photos FOR SELECT
      USING (approved = true AND wedding_id IN (SELECT id FROM weddings WHERE is_published = true));
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weddings_updated_at
  BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- FEATURE: ZONA DE JUEGOS — BINGO
-- ============================================================
CREATE TABLE IF NOT EXISTS bingo_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID REFERENCES weddings ON DELETE CASCADE NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT false,
  cell_type TEXT NOT NULL DEFAULT 'numbers' CHECK (cell_type IN ('numbers', 'emojis', 'photos')),
  card_size INT NOT NULL DEFAULT 9 CHECK (card_size IN (9, 16, 25)),
  number_max INT NOT NULL DEFAULT 75,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby', 'playing', 'paused', 'finished')),
  mode TEXT NOT NULL DEFAULT 'manual' CHECK (mode IN ('manual', 'auto')),
  auto_interval INT NOT NULL DEFAULT 6,
  drawn JSONB NOT NULL DEFAULT '[]'::jsonb,
  line_prize_enabled BOOLEAN DEFAULT true,
  bingo_prize_enabled BOOLEAN DEFAULT true,
  line_awarded BOOLEAN DEFAULT false,
  bingo_awarded BOOLEAN DEFAULT false,
  pending_claim JSONB,
  access_key UUID DEFAULT gen_random_uuid() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bingo_games ENABLE ROW LEVEL SECURITY;
-- Only the couple manages their game. All guest-facing reads/writes go through
-- API routes using the admin client (validated server-side), so no public RLS.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bingo_games' AND policyname = 'owner_all'
  ) THEN
    CREATE POLICY "owner_all" ON bingo_games FOR ALL
      USING (wedding_id IN (SELECT id FROM weddings WHERE user_id = auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS bingo_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES bingo_games ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  card JSONB NOT NULL DEFAULT '[]'::jsonb,
  marked JSONB NOT NULL DEFAULT '[]'::jsonb,
  has_line BOOLEAN DEFAULT false,
  has_bingo BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bingo_players_game_idx ON bingo_players (game_id);
ALTER TABLE bingo_players ENABLE ROW LEVEL SECURITY;
-- Couple reads their players via owner_all; guest writes go through the admin client.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bingo_players' AND policyname = 'owner_all'
  ) THEN
    CREATE POLICY "owner_all" ON bingo_players FOR ALL
      USING (game_id IN (
        SELECT bg.id FROM bingo_games bg
        JOIN weddings w ON w.id = bg.wedding_id
        WHERE w.user_id = auth.uid()
      ));
  END IF;
END $$;

DROP TRIGGER IF EXISTS bingo_games_updated_at ON bingo_games;
CREATE TRIGGER bingo_games_updated_at
  BEFORE UPDATE ON bingo_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
