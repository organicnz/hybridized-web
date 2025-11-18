# Supabase Edge Functions

## Deployed Functions

### 1. cleanup-old-bands
**Purpose**: Manually removes incomplete band entries older than 30 days

**Schedule**: Manual only (not automated)

**Endpoint**: `https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/cleanup-old-bands`

**What it does**:
- Deletes bands with no name or description
- Only removes entries older than 30 days
- Returns count of deleted records
- **Note**: This function is available but NOT scheduled to run automatically

**Manual trigger**:
```bash
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/cleanup-old-bands \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 2. sync-profile-data
**Purpose**: Syncs user profiles with auth.users data

**Schedule**: Every 6 hours

**Endpoint**: `https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-profile-data`

**What it does**:
- Creates missing profiles for auth users
- Updates existing profiles with latest email
- Ensures data consistency between auth and profiles

**Manual trigger**:
```bash
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-profile-data \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

### 3. search-bands
**Purpose**: Advanced full-text search for bands

**Endpoint**: `https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/search-bands?q=rock&limit=10`

**Parameters**:
- `q` (required): Search query
- `limit` (optional): Max results (default: 10)

**What it does**:
- Uses PostgreSQL full-text search with ranking
- Searches across name, description, and formula
- Returns results sorted by relevance

**Usage example**:
```typescript
const response = await fetch(
  `https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/search-bands?q=jazz&limit=20`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  }
);
const { results, count } = await response.json();
```

---

### 4. generate-band-stats
**Purpose**: Generates platform statistics

**Schedule**: Every hour

**Endpoint**: `https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/generate-band-stats`

**What it does**:
- Counts total bands
- Tracks bands with formulas
- Tracks bands with media
- Calculates recent activity (last 7 days)
- Computes completion rate

**Response example**:
```json
{
  "totalBands": 23,
  "bandsWithFormulas": 18,
  "bandsWithMedia": 15,
  "recentBands": 3,
  "completionRate": "78.3",
  "timestamp": "2025-11-18T12:00:00.000Z"
}
```

---

## Cron Jobs

Active cron jobs managed by `pg_cron` extension:

| Job Name | Schedule | Function | Description |
|----------|----------|----------|-------------|
| sync-profiles-every-6h | `0 */6 * * *` | sync-profile-data | Every 6 hours |
| generate-stats-hourly | `0 * * * *` | generate-band-stats | Every hour |

**Note**: cleanup-old-bands is available but NOT scheduled automatically to preserve all band data.

### View Cron Jobs
```sql
SELECT * FROM cron.job;
```

### View Cron Job History
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Unschedule a Job
```sql
SELECT cron.unschedule('cleanup-old-bands-daily');
```

---

## Database Function

### search_bands(search_query TEXT)

SQL function that powers the search-bands edge function:

```sql
SELECT * FROM search_bands('rock music');
```

Returns bands ranked by relevance using PostgreSQL's full-text search capabilities.

---

## Environment Variables Required

Edge functions need these environment variables (auto-configured in Supabase):
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Testing Edge Functions

Test locally using Supabase CLI:
```bash
supabase functions serve search-bands --env-file .env
```

Test deployed functions:
```bash
supabase functions invoke search-bands --body '{"q":"jazz"}'
```
