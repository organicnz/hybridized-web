-- Row Level Security for public.settings
--
-- Idempotent and reconciling, matching the pattern of
-- 20250701000001_rls_and_indexes.sql. Safe to re-run.
--
-- Intent:
--   settings: owner-only read/write (per-user equalizer, volume, last_artist,
--             last_track). Any authenticated caller may only touch their own row.
--
-- The service-role key (used by /api/v1/sync-* and the sync cron) bypasses RLS,
-- so server-side sync keeps working unchanged.

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own settings" ON public.settings;
DROP POLICY IF EXISTS "Users insert own settings" ON public.settings;
DROP POLICY IF EXISTS "Users update own settings" ON public.settings;
DROP POLICY IF EXISTS "Users delete own settings" ON public.settings;

-- Read/update/delete: owner only.
CREATE POLICY "Users read own settings" ON public.settings
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users update own settings" ON public.settings
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Insert is owner-only too; the handle_new_user_settings() trigger relies on
  -- SECURITY DEFINER so signup provisioning still works.
CREATE POLICY "Users insert own settings" ON public.settings
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users delete own settings" ON public.settings
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());
