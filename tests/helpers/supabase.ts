import { mock } from "bun:test";

/**
 * The one mock boundary for the whole Supabase area of the app.
 *
 * `@supabase/ssr` is mocked here rather than in each test file, because Bun
 * runs every test file in one process with one module registry: a
 * `mock.module` call in one file replaces the module for every other file
 * too. Registering the mock once, in a shared helper, means there is a
 * single source of truth and no file can clobber another's mock.
 *
 * The code under test is the *real* code — `lib/supabase/client.ts` and
 * `lib/user-storage.ts` both run unmodified, and only the SDK boundary
 * below them is replaced.
 */

/** The user the fake browser client reports. `null` means signed out. */
let currentUser: { id: string } | null = { id: "user-1" };

/** Set the user the fake browser client reports. */
export function setCurrentUser(user: { id: string } | null): void {
  currentUser = user;
}

/** The fake browser client's `auth.getUser`. */
export const getUser = mock(async () => ({ data: { user: currentUser } }));

export const createBrowserClient = mock((_url: string, _key: string) => ({
  id: "fake-browser-client",
  auth: { getUser },
}));

interface Cookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

interface CookieAdapter {
  getAll(): Cookie[];
  setAll(cookiesToSet: Cookie[]): void;
}

/**
 * Whether the server client renews the session.
 *
 * `@supabase/ssr` reads the request's cookies and writes the refreshed ones
 * back when the access token has expired. The fake does the same when this
 * is on; a test that is about the cookie plumbing itself turns it off.
 */
let refreshesSession = false;

/** Turn the session renewal on or off. */
export function setRefreshesSession(value: boolean): void {
  refreshesSession = value;
}

/**
 * The server client.
 *
 * It stands in for `@supabase/ssr`, which reads the request's cookies and
 * writes the refreshed ones back when the session is renewed — so the fake
 * does the same, and the code that handles the cookies is exercised.
 */
export const createServerClient = mock((_url: string, _key: string, options: unknown) => {
  const adapter = (options as { cookies?: CookieAdapter } | undefined)?.cookies;

  const current = adapter?.getAll() ?? [];
  if (refreshesSession) {
    adapter?.setAll([{ name: "sb-access-token", value: "refreshed", options: { path: "/" } }]);
  }

  return {
    id: "fake-server-client",
    auth: { getUser },
    cookies: current,
  };
});

/**
 * The plain SDK, used by the service and static clients.
 *
 * `mock.module` is global to the process, so this is registered here rather
 * than in the test file that needs it.
 */
export const createSupabaseClient = mock((_url: string, _key: string, _options?: unknown) => ({
  id: "fake-supabase-client",
}));

// A mock factory replaces the module's *entire* export set, so it has to
// provide every named export the real module has. Anything left out is
// missing from the module for the rest of the run, and Bun's ESM linking
// cannot add an export back to an existing import.
mock.module("@supabase/ssr", () => ({ createBrowserClient, createServerClient }));
mock.module("@supabase/supabase-js", () => ({ createClient: createSupabaseClient }));
