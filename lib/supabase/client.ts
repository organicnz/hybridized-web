import type { SupabaseClient } from "@supabase/supabase-js";

let clientPromise: Promise<SupabaseClient> | null = null;

/**
 * Lazily create the browser Supabase client.
 *
 * The SDK is ~200 kB, so it is loaded as an async chunk on first use instead of
 * being pulled into the critical path of every page. The promise is memoised so
 * the app shares one client — and therefore one auth listener — rather than
 * building a new one per call.
 */
export function getSupabase(): Promise<SupabaseClient> {
  if (!clientPromise) {
    clientPromise = import("@supabase/ssr").then(
      ({ createBrowserClient }) =>
        createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ) as unknown as SupabaseClient,
    );
  }

  return clientPromise;
}
