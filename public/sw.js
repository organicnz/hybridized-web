// Service Worker for caching music assets
const CACHE_NAME = "hybridized-v3";
const AUDIO_CACHE_NAME = "hybridized-audio-v3";
const CACHE_URLS = ["/home", "/logo.png", "/favicon.png"];

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS);
    }),
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// Check if request is for audio
function isAudioRequest(url) {
  return (
    url.includes(".mp3") ||
    url.includes(".m4a") ||
    url.includes(".wav") ||
    url.includes(".ogg") ||
    url.includes("audio") ||
    url.includes("cloudfront.net")
  );
}

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") return;

  // Skip chrome extensions and other protocols
  if (!event.request.url.startsWith("http")) return;

  const url = event.request.url;

  // Skip root path redirects - let them pass through
  if (url.endsWith("/") && !url.includes("/home")) {
    return;
  }

  // Handle audio files with cache-first strategy
  if (isAudioRequest(url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("Serving audio from cache:", url);
            return cachedResponse;
          }

          return fetch(event.request, { redirect: "follow" }).then((response) => {
            // Cache successful audio responses
            if (response && response.status === 200) {
              console.log("Caching audio:", url);
              cache.put(event.request, response.clone());
            }
            return response;
          });
        });
      }),
    );
    return;
  }

  // Handle other requests
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request, { redirect: "follow" }).then((response) => {
        // Don't cache redirects or non-successful responses
        if (!response || response.status !== 200 || response.type === "error" || response.type === "opaqueredirect") {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache images and static assets
        if (
          url.includes("/logo.png") ||
          url.includes("/favicon.png") ||
          url.includes("supabase.co")
        ) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }

        return response;
      });
    }),
  );
});
