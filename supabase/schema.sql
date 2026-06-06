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
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weddings_updated_at
  BEFORE UPDATE ON weddings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
