-- Core tables: bands, episodes and settings
--
-- These three tables were created out of band, so no migration owned them.
-- `20250101000001_settings_trigger.sql` inserts into `settings`, and
-- `20250701000001_rls_and_indexes.sql` alters, indexes and writes policies
-- against `episodes` and `bands` — so the chain could not build a fresh
-- database: it failed on the first statement that touched a table nobody had
-- created.
--
-- This migration creates them, and it sorts *before* the migrations that
-- assume them, so the chain works from nothing.
--
-- The columns, types and nullability match the generated types in
-- `lib/types/database.types.ts` and the `search_episodes` return type, so
-- the schema here is the schema the application talks to.
--
-- Idempotent: `IF NOT EXISTS` throughout, so applying it to a database that
-- already has the tables is a no-op.

-- ─── bands ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.bands (
  id BIGSERIAL PRIMARY KEY,
  id_new BIGINT,
  name TEXT,
  description TEXT,
  formula TEXT,
  iframe_url TEXT,
  cover_url TEXT,
  soundcloud_url TEXT,
  firstory_user_id TEXT,
  other TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── episodes ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.episodes (
  id BIGSERIAL PRIMARY KEY,
  episode_id TEXT NOT NULL,
  band_id BIGINT REFERENCES public.bands (id),
  title TEXT NOT NULL,
  description TEXT,
  audio_url TEXT NOT NULL,
  cover_url TEXT,
  pub_date TIMESTAMPTZ,
  duration INTEGER,
  audio_length BIGINT,
  creator TEXT,
  explicit BOOLEAN,
  link TEXT,
  guid TEXT,
  enclosure_type TEXT,
  created_at TIMESTAMPTZ
);

-- ─── settings ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- The default is the flat ten-band equaliser the signup trigger installs.
  gains JSONB NOT NULL DEFAULT '[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]'::jsonb,
  volume_settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  -- The name matters: `20250101000001_settings_trigger.sql` looks for
  -- `settings_user_id_key` by name, and its backfill uses `ON CONFLICT
  -- (user_id)`, which needs the unique index to already be there.
  CONSTRAINT settings_user_id_key UNIQUE (user_id)
);

-- ─── profiles: the columns the application reads ────────────────────────────
--
-- `20240101000000_auth_setup.sql` creates `profiles` with five columns. The
-- live table carries five more, added out of band, and the application
-- depends on them:
--
--   admin      — `lib/api/auth.ts` selects it to decide who may call the
--                sync endpoints. On a database without it the query errors,
--                the error is swallowed, and *nobody* is ever an admin.
--   updated_at — written by the `sync-profile-data` edge function.
--   phone, username, website — part of the profile the app reads and edits.
--
-- `ADD COLUMN IF NOT EXISTS` is a no-op on a database that already has them.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS admin BOOLEAN;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
