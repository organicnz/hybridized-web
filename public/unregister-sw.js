// Turn the service worker off.
//
// Unregistering it on its own is not enough: the app registers the worker on
// every load, so it would be back on the next page. The flag is what makes
// it stick, and the app reads the same key.
//
// The key is written out here rather than imported because this file is
// served as it is, and a service worker script cannot import anything.
const DISABLED_KEY = "hybridized-sw-disabled";

try {
  localStorage.setItem(DISABLED_KEY, "1");
} catch {
  // A browser with storage turned off cannot keep the flag. The worker is
  // unregistered below anyway, which is most of what this page is for.
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then(function (registrations) {
      return Promise.all(
        registrations.map(function (registration) {
          return registration.unregister();
        }),
      );
    })
    .catch(function () {
      // The worker may already be gone, or the browser may refuse. The flag
      // above is what matters; this is the tidying up.
    });
}
