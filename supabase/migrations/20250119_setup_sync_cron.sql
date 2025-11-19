-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing cron job if it exists
SELECT cron.unschedule('sync-firstory-episodes');

-- Create cron job to sync Firstory episodes every 6 hours
-- This will call the edge function via HTTP
SELECT cron.schedule(
  'sync-firstory-episodes',
  '0 */6 * * *', -- Every 6 hours at minute 0
  $$
  SELECT
    net.http_post(
      url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) as request_id;
  $$
);

-- Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'sync-firstory-episodes';
