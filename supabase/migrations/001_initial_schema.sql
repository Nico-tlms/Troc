-- ─── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ─── Profiles ─────────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  city          TEXT,
  latitude      DECIMAL(9,6),
  longitude     DECIMAL(9,6),
  bio           TEXT,
  phone         TEXT,
  phone_verified   BOOLEAN DEFAULT FALSE,
  id_verified      BOOLEAN DEFAULT FALSE,
  reputation_score DECIMAL(3,2) DEFAULT 0,
  exchange_count   INTEGER DEFAULT 0,
  is_suspended     BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Categories ───────────────────────────────────────────────────────────────
CREATE TABLE categories (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name      TEXT NOT NULL,
  slug      TEXT UNIQUE NOT NULL,
  icon      TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0
);

INSERT INTO categories (name, slug, icon, sort_order) VALUES
  ('High-Tech',     'tech',       '💻', 1),
  ('Jeux vidéo',    'gaming',     '🎮', 2),
  ('Mobilier',      'furniture',  '🪑', 3),
  ('Mode',          'fashion',    '👗', 4),
  ('Sport & Loisirs','sports',    '⚽', 5),
  ('Livres',        'books',      '📚', 6),
  ('Musique',       'music',      '🎸', 7),
  ('Jardin',        'garden',     '🌿', 8),
  ('Art & Collection','art',      '🎨', 9),
  ('Véhicules',     'vehicles',   '🚗', 10),
  ('Autre',         'other',      '📦', 99);

-- ─── Listings ─────────────────────────────────────────────────────────────────
CREATE TABLE listings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- What I offer
  propose_title         TEXT NOT NULL,
  propose_description   TEXT,
  propose_category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  propose_condition     TEXT CHECK (propose_condition IN ('new','like_new','good','fair','poor')),
  propose_estimated_value INTEGER,          -- cents
  propose_images        TEXT[] DEFAULT '{}',

  -- What I want in return
  search_title          TEXT NOT NULL,
  search_description    TEXT,
  search_category_id    UUID REFERENCES categories(id) ON DELETE SET NULL,
  search_condition_min  TEXT CHECK (search_condition_min IN ('new','like_new','good','fair','poor')),
  search_value_min      INTEGER,            -- cents
  search_value_max      INTEGER,            -- cents
  search_keywords       TEXT[] DEFAULT '{}',

  -- Geolocation
  location_lat          DECIMAL(9,6),
  location_lng          DECIMAL(9,6),
  location_city         TEXT,
  max_distance_km       INTEGER DEFAULT 50,

  -- Status & metadata
  status      TEXT DEFAULT 'active' CHECK (status IN ('draft','active','matched','completed','archived','removed')),
  view_count  INTEGER DEFAULT 0,

  -- Full-text search vector
  search_vector TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('french',
      coalesce(propose_title,'') || ' ' ||
      coalesce(propose_description,'') || ' ' ||
      coalesce(search_title,'') || ' ' ||
      coalesce(search_description,'')
    )
  ) STORED,

  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_propose_category ON listings(propose_category_id);
CREATE INDEX idx_listings_search_category ON listings(search_category_id);
CREATE INDEX idx_listings_location ON listings USING GIST (
  point(location_lng, location_lat)
) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
CREATE INDEX idx_listings_search_vector ON listings USING GIN(search_vector);

-- ─── Matches ──────────────────────────────────────────────────────────────────
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_a_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  listing_b_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_a_id     UUID NOT NULL REFERENCES profiles(id),
  user_b_id     UUID NOT NULL REFERENCES profiles(id),
  match_score   DECIMAL(5,2) DEFAULT 0,
  match_type    TEXT DEFAULT 'bilateral' CHECK (match_type IN ('bilateral','chain')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed','expired')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_a_id, listing_b_id),
  CHECK (listing_a_id < listing_b_id)  -- canonical ordering
);

CREATE INDEX idx_matches_user_a ON matches(user_a_id);
CREATE INDEX idx_matches_user_b ON matches(user_b_id);
CREATE INDEX idx_matches_status ON matches(status);

-- ─── Chain matches ────────────────────────────────────────────────────────────
CREATE TABLE chain_matches (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_ids   UUID[] NOT NULL,
  user_ids      UUID[] NOT NULL,
  chain_length  INTEGER NOT NULL CHECK (chain_length >= 3),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','completed','expired')),
  accepted_by   UUID[] DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chain_matches_status ON chain_matches(status);

-- ─── Conversations & Messages ─────────────────────────────────────────────────
CREATE TABLE conversations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id         UUID REFERENCES matches(id) ON DELETE SET NULL,
  chain_match_id   UUID REFERENCES chain_matches(id) ON DELETE SET NULL,
  participant_ids  UUID[] NOT NULL,
  last_message_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_participants ON conversations USING GIN(participant_ids);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);

CREATE TABLE messages (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id  UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES profiles(id),
  content          TEXT,
  image_url        TEXT,
  type             TEXT DEFAULT 'text' CHECK (type IN ('text','image','system','exchange_proposal')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Update last_message_at on new message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_message_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

-- ─── Exchanges ────────────────────────────────────────────────────────────────
CREATE TABLE exchanges (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id                UUID REFERENCES matches(id) ON DELETE SET NULL,
  chain_match_id          UUID REFERENCES chain_matches(id) ON DELETE SET NULL,
  initiator_id            UUID NOT NULL REFERENCES profiles(id),
  participants            UUID[] NOT NULL,
  qr_code                 TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  qr_expires_at           TIMESTAMPTZ,
  compensation_amount     INTEGER DEFAULT 0,
  compensation_payer_id   UUID REFERENCES profiles(id),
  status                  TEXT DEFAULT 'pending_scan'
    CHECK (status IN ('pending_scan','scanning','confirmed','completed','cancelled','disputed')),
  confirmed_by            UUID[] DEFAULT '{}',
  completed_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchanges_status ON exchanges(status);
CREATE INDEX idx_exchanges_qr ON exchanges(qr_code);

-- ─── Reviews ──────────────────────────────────────────────────────────────────
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exchange_id  UUID NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
  reviewer_id  UUID NOT NULL REFERENCES profiles(id),
  reviewee_id  UUID NOT NULL REFERENCES profiles(id),
  rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exchange_id, reviewer_id)
);

-- Recompute reputation_score after new review
CREATE OR REPLACE FUNCTION refresh_reputation_score()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles SET
    reputation_score = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM reviews WHERE reviewee_id = NEW.reviewee_id
    ),
    exchange_count = (
      SELECT COUNT(DISTINCT exchange_id)
      FROM reviews WHERE reviewee_id = NEW.reviewee_id
    )
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_reputation
  AFTER INSERT OR UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION refresh_reputation_score();

-- ─── Reports ──────────────────────────────────────────────────────────────────
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id  UUID NOT NULL REFERENCES profiles(id),
  target_type  TEXT NOT NULL CHECK (target_type IN ('listing','profile','message','exchange')),
  target_id    UUID NOT NULL,
  reason       TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','reviewing','resolved','dismissed')),
  resolved_by  UUID REFERENCES profiles(id),
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);

-- ─── Notifications ────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

-- ─── Push tokens (Expo) ───────────────────────────────────────────────────────
CREATE TABLE push_tokens (
  id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token     TEXT NOT NULL,
  platform  TEXT CHECK (platform IN ('ios','android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Public profiles are viewable" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Listings
CREATE POLICY "Active listings are public" ON listings FOR SELECT
  USING (status IN ('active','matched') OR auth.uid() = user_id);
CREATE POLICY "Users manage own listings" ON listings FOR ALL USING (auth.uid() = user_id);

-- Matches: visible to involved users
CREATE POLICY "Match visibility" ON matches FOR SELECT
  USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- Chain matches: visible if user is in user_ids
CREATE POLICY "Chain match visibility" ON chain_matches FOR SELECT
  USING (auth.uid() = ANY(user_ids));

-- Conversations: visible to participants
CREATE POLICY "Conversation visibility" ON conversations FOR SELECT
  USING (auth.uid() = ANY(participant_ids));

-- Messages
CREATE POLICY "Message visibility" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
        AND auth.uid() = ANY(c.participant_ids)
    )
  );
CREATE POLICY "Users send own messages" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Exchanges
CREATE POLICY "Exchange visibility" ON exchanges FOR SELECT
  USING (auth.uid() = ANY(participants));

-- Reviews
CREATE POLICY "Reviews are public" ON reviews FOR SELECT USING (true);
CREATE POLICY "Reviewer can insert" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- Reports
CREATE POLICY "Users see own reports" ON reports FOR SELECT USING (auth.uid() = reporter_id);
CREATE POLICY "Users can report" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Notifications
CREATE POLICY "Own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- Push tokens
CREATE POLICY "Own push tokens" ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- ─── Profile auto-create on signup ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── updated_at triggers ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER set_updated_at_profiles   BEFORE UPDATE ON profiles   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_listings   BEFORE UPDATE ON listings   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_matches    BEFORE UPDATE ON matches    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_exchanges  BEFORE UPDATE ON exchanges  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
