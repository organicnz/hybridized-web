# Sync Firstory Setup - Final Steps

## ✅ Completed

1. ✅ Edge function deployed (`sync-firstory` v8)
2. ✅ Database schema updated with all Firstory fields
3. ✅ Cron job created (jobid: 9, runs every 6 hours)
4. ✅ Data validation and gentle processing implemented
5. ✅ Band matching logic optimized

## ⚠️ Manual Step Required

**Disable JWT Verification for the Edge Function:**

The edge function needs to be called without authentication from the cron job. You need to disable JWT verification in the Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/neslxchdtibzhxijxcbg/functions/sync-firstory
2. Click on the **Settings** or **Configuration** tab
3. Find **"Verify JWT"** setting
4. Set it to **OFF** or **Disabled**
5. Save changes

## Verify Setup

After disabling JWT verification, test the cron job:

```sql
-- Test the cron job command
SELECT
  net.http_post(
    url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory',
    headers := jsonb_build_object('Content-Type', 'application/json')
  ) as request_id;
```

Expected result: Should return a request_id (e.g., `{"request_id": 1}`)

## Current Configuration

- **Edge Function**: `sync-firstory` (version 8)
- **Cron Job**: `sync-firstory-episodes` (jobid: 9)
- **Schedule**: `0 */6 * * *` (Every 6 hours at 00:00, 06:00, 12:00, 18:00 UTC)
- **Batch Size**: 25 episodes per batch
- **Batch Delay**: 100ms between batches
- **JWT Verification**: Needs to be disabled manually

## Monitoring

Check cron job runs:

```sql
SELECT
  jobid,
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = 9
ORDER BY start_time DESC
LIMIT 10;
```

Check edge function logs:

- Dashboard → Edge Functions → sync-firstory → Logs

## Data Verification

Current status:

```sql
SELECT
  COUNT(*) as total_episodes,
  COUNT(band_id) as with_band_id,
  COUNT(*) - COUNT(band_id) as null_band_id,
  ROUND(100.0 * COUNT(band_id) / COUNT(*), 1) as coverage_percentage
FROM episodes;
```

Expected: 1,383 episodes with 100% band coverage
