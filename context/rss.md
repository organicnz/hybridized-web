# Firstory RSS Feed

## Feed URL

https://feed.firstory.me/rss/user/cl3ps0kge021i01y69qhnf36d

## User ID

cl3ps0kge021i01y69qhnf36d

## Sync Configuration

### Edge Function

- **Name**: `sync-firstory`
- **Location**: `supabase/functions/sync-firstory/`
- **Cron Schedule**: Every 6 hours (`0 */6 * * *`)

### Manual Trigger

```bash
# Trigger the edge function directly
curl -X POST https://neslxchdtibzhxijxcbg.supabase.co/functions/v1/sync-firstory \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Data Fields

The RSS feed provides the following fields that are synced to the `episodes` table:

- `title` - Episode title
- `guid` - Unique Firstory identifier
- `link` - Episode page URL
- `enclosure.url` - Direct audio file URL
- `enclosure.length` - File size in bytes
- `enclosure.type` - MIME type (audio/mpeg)
- `itunes:image` - Cover image URL
- `itunes:duration` - Duration in seconds
- `pubDate` - Publication date
- `dc:creator` - Creator name
- `itunes:explicit` - Explicit content flag
- `description` - Full episode description

## Band Matching

Episodes are automatically matched to bands based on artist names in the title:

- Case-insensitive matching
- Longest band name matched first
- Falls back to "Various Artists" if no match found
