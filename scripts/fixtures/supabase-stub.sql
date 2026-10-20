-- A minimal stand-in for the parts of Supabase the migrations touch.
--
-- Supabase provisions these itself: the `anon` / `authenticated` /
-- `service_role` roles, the `auth` schema with its `users` table, and the
-- `auth.uid()` helper that the row level security policies call. Plain
-- Postgres has none of them, so this file recreates just enough to apply
-- the migration chain and prove it works on a fresh database.
--
-- The roles are cluster-wide, so their creation is conditional.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb DEFAULT '{}'::jsonb
);

-- The helper the policies call. Supabase derives it from the request JWT.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
