/**
 * The service worker's opt-out.
 *
 * The worker caches the audio and nothing else, so it is not a risk to the
 * app — but a visitor whose browser misbehaves with it should be able to
 * turn it off without clearing the site's data.
 *
 * The key is in a module of its own because the static script that sets it
 * cannot import anything: `public/unregister-sw.js` is served as a file.
 * `bun run doctor` checks that the two agree.
 */

/** The worker's script, as it is served. */
export const SERVICE_WORKER_URL = "/sw.js";

/** The flag that keeps the worker from being registered. */
export const SERVICE_WORKER_DISABLED_KEY = "hybridized-sw-disabled";
