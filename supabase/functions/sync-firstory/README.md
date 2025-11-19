# Sync Firstory Edge Function

This Supabase Edge Function syncs episodes from the Firstory RSS feed to the database.

## Features

- ✅ Fetches all episodes from Firstory RSS feed
- ✅ Matches episodes to bands based on title
- ✅ Creates new episodes or updates existing ones
- ✅ Extracts all Firstory metadata (title, description, audio URL, cover, duration, etc.)
- ✅ Verifies data integrity after sync
- ✅ Runs automatically every 6 hours via cron job

## RSS Feed Source

```
https://feed.firstory.me/rss/user/cl3ps0kge021i01y69qhnf36d
```

## Data Fields Synced

- `episode_id` - Firstory GUID
- `guid` - Same as episode_id
- `title` - Episode title
- `description` - Full episode description
- `link` - Firstory episode link
- `audio_url` - Direct audio file URL
- `audio_length` - File size in bytes
- `enclosure_type` - MIME type (audio/mpeg)
- `cover_url` - Episode cover image
- `duration` - Duration in seconds
- `pub_date` - Publication date
- `creator` - Creator name (dc:creator)
- `explicit` - Explicit content flag
- `band_id` - Matched band ID

## Cron Schedule

Runs every 6 hours: `0 */6 * * *`

## Manual Trigger

You can manually trigger the sync via:

```bash
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Response Format

```json
{
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "rss_episodes": 1383,
  "created": 0,
  "updated": 1383,
  "matched": 1381,
  "errors": 0,
  "verification": {
    "total_episodes": 1383,
    "episodes_with_bands": 1383,
    "coverage_percentage": "100.0"
  }
}
```

## Error Handling

- Validates RSS feed response
- Skips episodes with missing required fields
- Logs errors for individual episodes
- Returns error count in response
- Continues processing even if some episodes fail

## Band Matching Logic

1. Extracts artist name from episode title
2. Sorts bands by name length (longest first)
3. Performs case-insensitive substring match
4. Assigns first matching band
5. Falls back to null if no match found

## Monitoring

Check function logs in Supabase dashboard:

- Navigate to Edge Functions
- Select `sync-firstory`
- View Logs tab
