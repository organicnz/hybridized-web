# Cron Jobs Configuration

The scheduled jobs live in the database, and the migrations own them. Nothing
here is made by hand: a job that is not in a migration is a job that nobody
can rebuild on a new database, and it is a job that can drift away from the
code that depends on it.

## The jobs

| Name                     | Schedule      | What it calls                            | Auth                     |
| ------------------------ | ------------- | ---------------------------------------- | ------------------------ |
| `sync-firstory-episodes` | `0 */6 * * *` | `sync-firstory` (new episodes)           | `FUNCTION_SECRET`        |
| `sync-profiles-every-6h` | `0 */6 * * *` | `sync-profile-data` (profiles)           | `FUNCTION_SECRET`        |
| `generate-stats-hourly`  | `0 * * * *`   | `generate-band-stats` (the band figures) | `FUNCTION_SECRET`        |
| `invoke-keepalive-6h`    | `0 */6 * * *` | `keep-alive-ping`                        | none — it answers anyone |
| `Ping Supabase`          | `0 0 * * *`   | `keep-alive-ping`                        | none — it answers anyone |

`20261022000002_fix_sync_cron_jobs.sql` creates them. It replaced five that
had been failing: one called a SQL function that exists nowhere, two built
their request headers by concatenating a JSON literal (so the statement itself
failed), one pointed at a function slug that is not deployed, one passed
`timeout_milliseconds:=undefined`, and the episode sync sent the service-role
key to a function that authenticates with `FUNCTION_SECRET` — so it was
answered with a 401, and the episodes table had not seen a new episode since
2025-11-18.

## The secret

The functions that need authentication share a secret: the caller sends
`Authorization: Bearer <FUNCTION_SECRET>` and the function compares it with
its own `Deno.env.get("FUNCTION_SECRET")`.

The database reads it from the vault:

```sql
app_private.function_secret()
```

The helper raises when the secret is not there, so a gap shows up in
`cron.job_run_details` with a message that says what to do — rather than as a
401 in a table nobody reads, which is how the outage went unnoticed for
eleven months.

No migration contains the secret. `bun scripts/set-function-secret.ts` puts
it in the vault:

```bash
bun run secret:function            # put the current secret in the vault
bun run secret:function --rotate   # generate a new one and set it everywhere
```

The script checks the secret against the live function before it uses it, so
it cannot put a value the functions would reject in the vault.

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

### See what the function answered

`net.http_post` is asynchronous: the database queues the request and records
the answer in `net._http_response` when it lands. This is where a 401 from a
function shows up.

```sql
SELECT status_code, created, left(content, 120) AS body
FROM net._http_response
WHERE url LIKE '%functions/v1%'
ORDER BY created DESC
LIMIT 10;
```

### Disable a cron job

```sql
UPDATE cron.job
SET active = false
WHERE jobname = 'generate-stats-hourly';
```

### Enable a cron job

```sql
UPDATE cron.job
SET active = true
WHERE jobname = 'generate-stats-hourly';
```

### Delete a cron job

```sql
SELECT cron.unschedule('generate-stats-hourly');
```

## Monitoring

Check the Supabase dashboard:

1. Go to Database → Cron Jobs
2. View execution history and logs
3. Monitor success/failure rates

## Troubleshooting

If a cron job fails:

1. Check `cron.job_run_details` for the error message
2. If it says the vault has no `function_secret`, run `bun run secret:function`
3. Verify the edge function is deployed and active
4. Check the edge function's logs in the Supabase dashboard
5. Look at `net._http_response` for the status the function answered with

## Adding New Cron Jobs

Write a migration. The pattern is `jsonb_build_object` — which cannot
produce invalid JSON — and `app_private.function_secret()` for the
authorization:

```sql
SELECT cron.schedule(
  'job-name',
  '0 3 * * *',  -- Schedule (3 AM daily)
  $cron$
  SELECT
    net.http_post(
      url := 'https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/your-function',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || app_private.function_secret()
      ),
      body := '{}'::jsonb
    ) as request_id;
  $cron$
);
```

A migration that names a job sorts after the ones that created it, so
`cron.schedule` updates the job rather than adding a second one.
