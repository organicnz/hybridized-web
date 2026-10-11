-- RLS Policies and Indexes for Hybridized
--
-- Idempotent and reconciling: this drops both the legacy out-of-band policy
-- names (created via the dashboard) and the canonical names this migration
-- owns, then recreates a single clean set. Safe to re-run.
--
-- Intent:
--   episodes / bands : public read, authenticated write (server-side sync)
--   profiles         : owner-only read/write (never public — the row carries
--                      email/phone; the app only ever reads the caller's own)

-- ─── episodes ────────────────────────────────────────────────────────────────
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to episodes" ON public.episodes;
DROP POLICY IF EXISTS "Allow authenticated users to insert episodes" ON public.episodes;
DROP POLICY IF EXISTS "Allow authenticated users to update episodes" ON public.episodes;
DROP POLICY IF EXISTS "Public read episodes" ON public.episodes;
DROP POLICY IF EXISTS "Authenticated write episodes" ON public.episodes;

CREATE POLICY "Public read episodes" ON public.episodes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write episodes" ON public.episodes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── bands ─────────────────────────────────────────────────────────────────
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Hybridized sounds are viewable by everyone" ON public.bands;
DROP POLICY IF EXISTS "Public read bands" ON public.bands;
DROP POLICY IF EXISTS "Authenticated write bands" ON public.bands;

CREATE POLICY "Public read bands" ON public.bands
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write bands" ON public.bands
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ─── profiles ──────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── indexes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS episodes_band_id_idx ON public.episodes(band_id);
CREATE INDEX IF NOT EXISTS episodes_pub_date_idx ON public.episodes(pub_date DESC);
CREATE INDEX IF NOT EXISTS episodes_episode_id_idx ON public.episodes(episode_id);

CREATE INDEX IF NOT EXISTS bands_name_idx ON public.bands(name);
CREATE INDEX IF NOT EXISTS bands_iframe_url_idx ON public.bands(iframe_url);

CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);

CREATE INDEX IF NOT EXISTS episodes_band_id_pub_date_idx ON public.episodes(band_id, pub_date DESC);
