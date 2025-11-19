# Cron Job Setup for sync-firstory

## Automatic Setup (Recommended)

Supabase automatically detects `cron.json` files in edge function directories and sets up cron jobs.

The `cron.json` file is already configured:

```json
{
  "schedule": "0 */6 * * *",
  "description": "Sync episodes from Firstory RSS feed every 6 hours"
}
```

This will run the edge function every 6 hours at minute 0 (00:00, 06:00, 12:00, 18:00 UTC).

## Manual Setup via Supabase Dashboard

If automatic setup doesn't work, configure manually:

1. Go to Supabase Dashboard
2. Navigate to **Database** > **Cron Jobs**
3. Click **Create a new cron job**
4. Configure:
   - **Name**: `sync-firstory-episodes`
   - **Schedule**: `0 */6 * * *` (every 6 hours)
   - **Command**:
   ```sql
   SELECT
     net.http_post(
       url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory',
       headers := jsonb_build_object(
         'Content-Type', 'application/json',
         'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
       ),
       body := '{}'::jsonb
     ) as request_id;
   ```

## Verify Cron Job

Check if cron job is running:

```sql
-- View all cron jobs
SELECT * FROM cron.job;

-- View cron job history
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'sync-firstory-episodes')
ORDER BY start_time DESC
LIMIT 10;
```

## Manual Trigger

Test the edge function manually:

```bash
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Schedule Options

- Current: `0 */6 * * *` - Every 6 hours
- Every 3 hours: `0 */3 * * *`
- Every 12 hours: `0 */12 * * *`
- Daily at midnight: `0 0 * * *`
- Every hour: `0 * * * *`

## Monitoring

Check edge function logs:

1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Select `sync-firstory`
4. View **Logs** tab

## Troubleshooting

If cron job isn't running:

1. Verify `pg_cron` extension is enabled
2. Check service role key is configured
3. Verify edge function is deployed and active
4. Check cron job logs for errors
5. Ensure project has sufficient resources
