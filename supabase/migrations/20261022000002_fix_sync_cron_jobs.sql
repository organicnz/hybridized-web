-- The scheduled jobs, repaired.
--
-- Six jobs were scheduled on the live database. Five of them were failing,
-- and two of them had never called their function once:
--
--   * the job with no name ran every five minutes and called
--     `keep_alive_ping()` — a SQL function that exists neither here nor on the
--     live database. It had failed 152,616 times;
--   * `generate-stats-hourly` and `sync-profiles-every-6h` built their request
--     headers by concatenating a JSON literal, so the statement itself failed
--     with "invalid input syntax for type json" — the function was never
--     reached;
--   * `sync-firstory-episodes` built its headers correctly but sent the
--     service-role key, while the functions authenticate with
--     `FUNCTION_SECRET` — so the request was answered with a 401, and the
--     episodes table had not seen a new episode since 2025-11-18;
--   * `invoke-keepalive-6h` posted to `functions/v1/keepalive`, a slug that
--     does not exist — the deployed function is `keep-alive-ping`;
--   * `Ping Supabase` passed `timeout_milliseconds:=undefined`, which is not
--     a value.
--
-- This migration puts them right:
--
--   * the job with no name is unscheduled — it called a function that never
--     existed and did nothing else;
--   * `Ping Supabase` keeps its purpose with a timeout that is a number;
--   * `invoke-keepalive-6h` points at the function that is deployed;
--   * the three jobs that call a function which requires authentication send
--     the secret, and they build their headers with `jsonb_build_object`,
--     which cannot produce invalid JSON.
--
-- The secret comes from the vault, and no migration in this repository
-- contains it: `bun scripts/set-function-secret.ts` puts it there. When it is
-- missing, the helper raises, so the job log says why — a 401 in a table
-- nobody reads is how this went unnoticed for eleven months.

-- ─── The secret ──────────────────────────────────────────────────────────────

CREATE SCHEMA IF NOT EXISTS app_private;

-- The shared secret the edge functions authenticate with.
--
-- It is read from the vault, where `bun scripts/set-function-secret.ts` puts
-- it, and it raises when it is not there: a job that fails with a clear
-- message is a job somebody can fix, and a job that fails with a 401 is not.
CREATE OR REPLACE FUNCTION app_private.function_secret()
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $function$
DECLARE
  secret text;
BEGIN
  SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
   WHERE name = 'function_secret'
   LIMIT 1;

  IF secret IS NULL OR secret = '' THEN
    RAISE EXCEPTION
      'the vault has no "function_secret" — run "bun scripts/set-function-secret.ts"';
  END IF;

  RETURN secret;
END;
$function$;

-- ─── The jobs ────────────────────────────────────────────────────────────────

-- The keep-alive ping that called a SQL function nobody ever created. It is
-- unscheduled by id, because it has no name to unschedule it by.
SELECT cron.unschedule(jobid)
  FROM cron.job
 WHERE jobname IS NULL OR jobname = '';

-- The daily ping. It had `timeout_milliseconds:=undefined` in it; the
-- default is 5000 milliseconds.
SELECT cron.schedule(
  'Ping Supabase',
  '0 0 * * *',
  $cron$
  SELECT net.http_get(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/keep-alive-ping',
    headers := jsonb_build_object(),
    timeout_milliseconds := 5000
  );
  $cron$
);

-- The keep-alive job pointed at `keepalive`; the deployed function is
-- `keep-alive-ping`.
SELECT cron.schedule(
  'invoke-keepalive-6h',
  '0 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/keep-alive-ping',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object('time', now())
  ) AS request_id;
  $cron$
);

-- The three jobs that call a function which requires authentication. They
-- send the secret, and they build their headers with `jsonb_build_object` so
-- the statement cannot produce invalid JSON.
SELECT cron.schedule(
  'sync-firstory-episodes',
  '0 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || app_private.function_secret()
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

SELECT cron.schedule(
  'sync-profiles-every-6h',
  '0 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-profile-data',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || app_private.function_secret()
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);

SELECT cron.schedule(
  'generate-stats-hourly',
  '0 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/generate-band-stats',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || app_private.function_secret()
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $cron$
);
