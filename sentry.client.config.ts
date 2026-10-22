/**
 * Sentry, and only when there is somewhere for it to report to.
 *
 * The SDK is a hundred and forty kilobytes, and it was loaded by every
 * visitor whether or not there was a DSN to report to. The deployment has
 * no `NEXT_PUBLIC_SENTRY_DSN`, so the whole SDK was downloaded by every page
 * load and reported nothing at all.
 *
 * The import is dynamic and the whole file only touches the SDK when there
 * is a DSN, so the chunk is fetched when there is somewhere to send a
 * report and never otherwise. Set the DSN and it behaves exactly as it did.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  void import("@sentry/nextjs").then((Sentry) => {
    Sentry.init({
      dsn,
      tracesSampleRate: 1.0,
      debug: process.env.NODE_ENV === "development",
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  });
}
