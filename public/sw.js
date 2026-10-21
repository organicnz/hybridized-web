// The service worker.
//
// It exists for one thing: a DJ set is tens of megabytes, and a visitor who
// plays the same one twice should not download it twice. So it caches the
// audio and lets everything else — the app's own data, the images, the
// page — go to the network.
//
// That "everything else" is the part that has to be right. A worker that
// answers a request from the cache when it should not does not show a stale
// picture: it shows stale *data*. The previous version matched any URL
// containing "cloudfront.net", which is the image CDN, and cached anything
// from "supabase.co", which is the database. An artist's list came from the
// cache and stayed there.
//
// The version is in the cache names. Bump it when the policy changes, so
// the old caches are dropped on the next activation.

const CACHE_NAME = "hybridized-v5";
const AUDIO_CACHE_NAME = "hybridized-audio-v5";

/** The files worth keeping a copy of. */
const CACHE_URLS = ["/logo.png", "/favicon.png"];

/**
 * How many sets to keep.
 *
 * A set is tens of megabytes, so this is a handful rather than a library.
 * The oldest goes first.
 */
const MAX_AUDIO_ENTRIES = 6;

/**
 * Whether a request is for audio.
 *
 * The extension, not the host: the audio and the artwork are served from the
 * same CDN, and only the file says which is which.
 */
function isAudioRequest(url) {
  return /\.(mp3|m4a|wav|ogg|oga|aac)(\?|$)/i.test(url);
}

// Install — cache the few files that are always wanted.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// Activate — drop the caches of every previous version.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Drop the oldest entries until the cache is within the limit. */
async function trimCache(cache, limit) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - limit; i++) {
    await cache.delete(keys[i]);
  }
}

/** The audio, from the cache if it is there and from the network if not. */
async function audioResponse(request) {
  const cache = await caches.open(AUDIO_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.status === 200) {
    await cache.put(request, response.clone());
    await trimCache(cache, MAX_AUDIO_ENTRIES);
  }

  return response;
}

// Fetch — the audio is cached; everything else is the network's business.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith("http")) return;
  if (!isAudioRequest(event.request.url)) return;

  event.respondWith(audioResponse(event.request));
});
