# Firstory Playlist Sync Solution

## Problem

Firstory playlists (like https://open.firstory.me/embed/playlists/cl3rmtqxu033s01092gap8bwj) show more episodes than what's available in the main RSS feed.

## Investigation Results

1. **Main RSS Feed**: `https://feed.firstory.me/rss/user/cl3ps0kge021i01y69qhnf36d`
   - Contains ALL episodes for the podcast (1,383 episodes)
   - Only 3 episodes have "Benz & MD" in the title
   - This is what podcast apps and our current sync function use

2. **Playlist-Specific RSS**: `https://feed.firstory.me/rss/user/cl3ps0kge021i01y69qhnf36d/playlist/cl3rmtqxu033s01092gap8bwj`
   - Returns "Access Denied" error
   - Not publicly accessible

3. **Firstory Web Interface**: Uses internal GraphQL API
   - Endpoint: Likely `https://api.firstory.me/graphql` or similar
   - Requires authentication or specific headers
   - Not documented publicly

## Current Status

The sync is working correctly - it fetches all episodes from the public RSS feed. The discrepancy is because:

- Firstory's internal playlist system has different data than their public RSS feed
- Playlists are organizational tools on their website, not reflected in RSS

## Solutions

### Option 1: Use Main RSS Feed (Current - Working ✅)

Continue using the main RSS feed which contains all public episodes. This is the standard approach for podcast aggregation.

**Pros:**

- Already implemented and working
- Uses official public API
- Reliable and stable

**Cons:**

- May not match Firstory's internal playlist organization
- Limited to what's in the RSS feed

### Option 2: Contact Firstory Support

Ask Firstory to:

- Provide playlist-specific RSS feeds
- Document their GraphQL API
- Explain the discrepancy between RSS and web interface

### Option 3: Manual Mapping

Manually identify which episodes should belong to "Benz & MD" and update the database accordingly.

## Recommendation

**Stick with Option 1** (current RSS sync) because:

1. It's the official, public way to access podcast data
2. All podcast apps use RSS feeds
3. The data is reliable and consistent
4. We're getting all publicly available episodes

If you need specific playlist organization, consider creating your own playlist/tagging system in the database based on the episodes we already have.
