-- The behaviour the migration chain has to produce.
--
-- Every block raises an exception when its expectation does not hold, so
-- applying this file to a migrated database is the assertion. It runs as
-- the superuser, so it reads the tables directly rather than through the
-- row level security policies — the policies are checked separately, by
-- their presence and by `rowsecurity`.
--
-- Usage: psql -v ON_ERROR_STOP=1 -f migration-assertions.sql

-- ─── the signup triggers ────────────────────────────────────────────────────
-- handle_new_user() creates a profile; handle_new_user_settings() creates a
-- settings row with the default equaliser.
DO $$
DECLARE
  new_user uuid := '11111111-1111-1111-1111-111111111111';
  profile_count int;
  settings_count int;
  default_gains jsonb;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (new_user, 'someone@example.com', '{"full_name":"Someone"}');

  SELECT count(*) INTO profile_count FROM public.profiles WHERE id = new_user;
  IF profile_count <> 1 THEN
    RAISE EXCEPTION 'the signup trigger did not create a profile row';
  END IF;

  -- jsonb has no ordering, so `max()` does not exist for it; `array_agg` does.
  SELECT count(*), (array_agg(gains))[1] INTO settings_count, default_gains
  FROM public.settings WHERE user_id = new_user;
  IF settings_count <> 1 THEN
    RAISE EXCEPTION 'the signup trigger did not create a settings row';
  END IF;
  IF default_gains <> '[0,0,0,0,0,0,0,0,0,0]'::jsonb THEN
    RAISE EXCEPTION 'the settings row has the wrong default equaliser: %', default_gains;
  END IF;
END
$$;

-- ─── the admin flag ─────────────────────────────────────────────────────────
-- `lib/api/auth.ts` reads this column. Without it, `isSyncAuthorized` throws,
-- the error is swallowed, and nobody is ever an admin.
DO $$
DECLARE
  is_admin boolean;
BEGIN
  UPDATE public.profiles SET admin = true
  WHERE id = '11111111-1111-1111-1111-111111111111';

  SELECT admin INTO is_admin FROM public.profiles
  WHERE id = '11111111-1111-1111-1111-111111111111';

  IF is_admin IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'the admin flag did not persist';
  END IF;
END
$$;

-- ─── the search function ─────────────────────────────────────────────────────
DO $$
DECLARE
  hits int;
  found_title text;
BEGIN
  INSERT INTO public.bands (name, description, firstory_user_id)
  VALUES ('Ada Band', 'Another band', 'usr999');

  INSERT INTO public.episodes
    (episode_id, band_id, title, description, audio_url, pub_date, creator, audio_length, duration)
  VALUES (
    'cldef456',
    (SELECT id FROM public.bands WHERE name = 'Ada Band'),
    'Searchable Episode',
    'A description',
    'https://cdn.example/b.mp3',
    NOW(),
    'Ada Band',
    99,
    30
  );

  SELECT count(*) INTO hits FROM public.search_episodes('Searchable Ep');
  IF hits <> 1 THEN
    RAISE EXCEPTION 'search_episodes did not find the episode by title';
  END IF;

  SELECT count(*) INTO hits FROM public.search_episodes('Ada Band');
  IF hits <> 1 THEN
    RAISE EXCEPTION 'search_episodes did not find the episode by band name';
  END IF;

  SELECT max(title) INTO found_title FROM public.search_episodes('Searchable Ep');
  IF found_title <> 'Searchable Episode' THEN
    RAISE EXCEPTION 'search_episodes returned the wrong row: %', found_title;
  END IF;

  -- The result limit is clamped to at least one row.
  SELECT count(*) INTO hits FROM public.search_episodes('a', 0);
  IF hits < 1 THEN
    RAISE EXCEPTION 'search_episodes did not clamp a zero limit';
  END IF;
END
$$;

-- ─── the upsert the sync endpoint performs ───────────────────────────────────
-- `POST /api/v1/sync-episodes` upserts with `onConflict: "episode_id"`, and
-- PostgREST turns that into `INSERT ... ON CONFLICT (episode_id) DO UPDATE`.
-- Postgres needs a unique index on the column: without one it raises 42P10
-- and the endpoint reports success while syncing nothing.
DO $$
DECLARE
  episode_count int;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = 'public.episodes'::regclass
      AND i.indisunique
      AND i.indnatts = 1
      AND a.attname = 'episode_id'
  ) THEN
    RAISE EXCEPTION
      'episodes.episode_id is not unique, so the sync endpoint cannot upsert';
  END IF;

  INSERT INTO public.episodes (episode_id, title, audio_url)
  VALUES ('clupsert001', 'The first version', 'https://cdn.example/upsert.mp3')
  ON CONFLICT (episode_id) DO UPDATE SET title = EXCLUDED.title;

  INSERT INTO public.episodes (episode_id, title, audio_url)
  VALUES ('clupsert001', 'The second version', 'https://cdn.example/upsert.mp3')
  ON CONFLICT (episode_id) DO UPDATE SET title = EXCLUDED.title;

  SELECT count(*) INTO episode_count
  FROM public.episodes WHERE episode_id = 'clupsert001';

  IF episode_count <> 1 THEN
    RAISE EXCEPTION 'the upsert made % rows for one episode, not one', episode_count;
  END IF;
END
$$;

-- ─── the row level security policies ─────────────────────────────────────────
DO $$
DECLARE
  table_name text;
  expected int;
  actual int;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['episodes', 'bands', 'profiles', 'settings'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables
      WHERE schemaname = 'public' AND tablename = table_name AND rowsecurity
    ) THEN
      RAISE EXCEPTION 'row level security is not enabled on %', table_name;
    END IF;

    SELECT count(*) INTO actual FROM pg_policies WHERE tablename = table_name;
    IF actual = 0 THEN
      RAISE EXCEPTION 'no policies on %', table_name;
    END IF;
  END LOOP;
END
$$;

SELECT 'all migration assertions passed' AS result;
