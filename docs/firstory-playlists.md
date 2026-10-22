# Firstory Playlists

The episodes come from Firstory's RSS feed, which works:

```
https://feed.firstory.me/rss/user/{userId}
```

The _band_ a playlist belongs to comes from the playlist page, and that is
where the site changed.

## What the site does now

| URL                                     | What it answers                         |
| --------------------------------------- | --------------------------------------- |
| `feed.firstory.me/rss/user/{id}`        | The RSS feed — the episodes. It works.  |
| `hybridized.firstory.io/episodes?…`     | Nothing. The domain does not resolve.   |
| `open.firstory.me/api/playlists/{id}`   | 404.                                    |
| `open.firstory.me/embed/playlists/{id}` | 200, with no episode links in the HTML. |
| `open.firstory.me/playlists/{id}`       | 200, with no episode links in the HTML. |

The playlist pages are a Next.js application now: the episode links are
rendered in the browser, so they are not in the HTML the server sends. The
page still names the episodes — 54 mentions of "episodes" and 123 of "story"
— but not as links to `/episodes/cl…`, which is what the extractors match
on.

## What this breaks

- **`sync-firstory`, phase 2** — the function walks the bands and reads each
  band's playlist to link the episodes to the band. It used the domain that
  no longer resolves, so every band failed with a DNS error on every run. It
  now reads the page that exists and _reports_ that the page lists no
  episodes, rather than reporting a quiet zero.
- **`GET /api/v1/playlist-episodes`** — the application's route scrapes the
  embed page for `story/cl…` links. The page has none, so the route answers
  `{"episodeIds":[]}`: a success with nothing in it. It needs the same
  treatment the function got — an error instead of an empty list — and the
  same extractor.
- **`POST /api/v1/sync-playlists`** — the route asks
  `open.firstory.me/api/playlists/{id}` for JSON. That path answers 404, so
  every band is reported as an error.

## What is needed to fix it

The playlists have to come from the API the page itself calls, which is the
same shape the application already expects:

```ts
interface PlaylistAPIResponse {
  episodes?: { id?: string; episode_id?: string }[];
  items?: { id?: string; episode_id?: string }[];
  data?: { id?: string; episode_id?: string }[];
}
```

The path that answers it today is not known — `open.firstory.me/api/playlists/{id}`
answers 404 — so the endpoint the page uses has to be found. Until then, the
episode titles carry the band name (`Nick Warren - Live At Shine B2B …`), and
`sync-firstory`'s first phase matches on the title, which is why the feed
still lands the episodes even though the playlist phase cannot.

Nothing about this is guesswork that the code should hide: the phase says
what it found, and the job log says what the function answered.
