-- The scheduled jobs get a timeout that fits what they do.
--
-- `pg_net` waits five seconds for a response by default, and the episode
-- sync takes longer than that: it reads the Firstory feed, writes every
-- episode, and then walks the bands. The sync itself was never affected —
-- the function carries on after the database stops waiting — but the job
-- logged a timeout every time, so a job that worked looked like a job that
-- failed.
--
-- Thirty seconds is enough for the sync and short enough that a function
-- which really is stuck does not hold the queue.

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
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
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
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
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
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $cron$
);
