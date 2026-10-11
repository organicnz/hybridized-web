-- RLS Policies and Indexes for Hybridized

-- Enable RLS on episodes table
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;

-- Public read access to episodes (catalog is public)
CREATE POLICY "Public read episodes" ON public.episodes
  FOR SELECT USING (true);

-- Authenticated users can insert/update/delete episodes
CREATE POLICY "Authenticated write episodes" ON public.episodes
  FOR ALL TO authenticated USING (true);

-- Enable RLS on bands table
ALTER TABLE public.bands ENABLE ROW LEVEL SECURITY;

-- Public read access to bands
CREATE POLICY "Public read bands" ON public.bands
  FOR SELECT USING (true);

-- Authenticated users can insert/update/delete bands
CREATE POLICY "Authenticated write bands" ON public.bands
  FOR ALL TO authenticated USING (true);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Indexes for common query patterns

-- Episodes table indexes
CREATE INDEX IF NOT EXISTS episodes_band_id_idx ON public.episodes(band_id);
CREATE INDEX IF NOT EXISTS episodes_pub_date_idx ON public.episodes(pub_date DESC);
CREATE INDEX IF NOT EXISTS episodes_episode_id_idx ON public.episodes(episode_id);

-- Bands table indexes
CREATE INDEX IF NOT EXISTS bands_name_idx ON public.bands(name);
CREATE INDEX IF NOT EXISTS bands_iframe_url_idx ON public.bands(iframe_url);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS profiles_id_idx ON public.profiles(id);

-- Sync-related indexes
CREATE INDEX IF NOT EXISTS episodes_band_id_pub_date_idx ON public.episodes(band_id, pub_date DESC);