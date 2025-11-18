# Cron Jobs Configuration

## Active Cron Jobs

| Job ID | Name | Schedule | Function | Status |
|--------|------|----------|----------|--------|
| 4 | sync-profiles-every-6h | `0 */6 * * *` | sync-profile-data | ✅ Active |
| 5 | generate-stats-hourly | `0 * * * *` | generate-band-stats | ✅ Active |

**Note**: cleanup-old-bands edge function exists but is NOT scheduled to preserve all band data.

## Schedule Explanation

- **sync-profiles-every-6h**: Runs every 6 hours (00:00, 06:00, 12:00, 18:00 UTC)
- **generate-stats-hourly**: Runs at the start of every hour

## Cron Schedule Format

```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, Sunday = 0 or 7)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

## Management Commands

### View all cron jobs
```sql
SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
```

### View cron job execution history
```sql
SELECT 
    jobid,
    runid,
    job_pid,
    status,
    start_time,
    end_time,
    return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Disable a cron job
```sql
UPDATE cron.job 
SET active = false 
WHERE jobname = 'cleanup-old-bands-daily';
```

### Enable a cron job
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'cleanup-old-bands-daily';
```

### Delete a cron job
```sql
SELECT cron.unschedule('cleanup-old-bands-daily');
```

### Manually trigger a job (via edge function)
```bash
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/cleanup-old-bands \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

Check the Supabase dashboard:
1. Go to Database → Cron Jobs
2. View execution history and logs
3. Monitor success/failure rates

## Troubleshooting

If a cron job fails:
1. Check `cron.job_run_details` for error messages
2. Verify edge function is deployed and active
3. Check edge function logs in Supabase dashboard
4. Ensure service role key is configured correctly

## Adding New Cron Jobs

```sql
SELECT cron.schedule(
  'job-name',
  '0 3 * * *',  -- Schedule (3 AM daily)
  $$
  SELECT
    net.http_post(
      url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/your-function',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);
```
