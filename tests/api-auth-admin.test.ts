import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

/**
 * The admin path of `isSyncAuthorized`.
 *
 * The shared-secret path is covered in `api-auth.test.ts`; this file covers
 * the other half — an authenticated Supabase user whose profile carries the
 * `admin` flag. The Supabase server client is mocked with `mock.module`, so
 * no request, cookie jar or database is involved.
 */

interface Profile {
  admin: boolean;
}

/** What the fake `profiles` query returns. */
let profile: Profile | null = null;
/** The user the fake auth returns. `null` means signed out. */
let user: { id: string } | null = { id: "user-1" };
/** When set, `auth.getUser` throws instead of returning. */
let authError: Error | null = null;

const getUser = mock(async () => {
  if (authError) throw authError;
  return { data: { user } };
});

const single = mock(async () => ({ data: profile }));
const eq = mock(() => ({ single }));
const select = mock(() => ({ eq }));
const from = mock(() => ({ select }));

// A mock factory replaces the module's whole export set, so every named
// export the real module has has to be in the factory.
mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser }, from }),
}));

const { isSyncAuthorized } = await import("@/lib/api/auth");

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("https://hybridized.online/api/v1/sync-episodes", {
    method: "POST",
    headers,
  });
}

const originalSecret = process.env.SYNC_SECRET;

describe("isSyncAuthorized (admin path)", () => {
  beforeEach(() => {
    profile = { admin: true };
    user = { id: "user-1" };
    authError = null;
    mock.clearAllMocks();
    // No shared secret, so the request has to be authorised by the profile.
    Reflect.deleteProperty(process.env, "SYNC_SECRET");
  });

  afterEach(() => {
    if (originalSecret === undefined) {
      Reflect.deleteProperty(process.env, "SYNC_SECRET");
    } else {
      process.env.SYNC_SECRET = originalSecret;
    }
  });

  it("authorises a user whose profile is flagged admin", async () => {
    expect(await isSyncAuthorized(makeRequest())).toBe(true);
  });

  it("queries the profile of the signed-in user", async () => {
    await isSyncAuthorized(makeRequest());

    expect(from).toHaveBeenCalledWith("profiles");
    expect(select).toHaveBeenCalledWith("admin");
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("denies a user whose profile is not flagged admin", async () => {
    profile = { admin: false };

    expect(await isSyncAuthorized(makeRequest())).toBe(false);
  });

  it("denies a user with no profile at all", async () => {
    profile = null;

    expect(await isSyncAuthorized(makeRequest())).toBe(false);
  });

  it("denies a signed-out caller", async () => {
    user = null;

    expect(await isSyncAuthorized(makeRequest())).toBe(false);
  });

  it("denies when Supabase throws", async () => {
    authError = new Error("supabase unreachable");

    expect(await isSyncAuthorized(makeRequest())).toBe(false);
  });

  it("still honours the shared secret when the profile says no", async () => {
    profile = { admin: false };
    process.env.SYNC_SECRET = "test-secret-value";

    expect(await isSyncAuthorized(makeRequest({ authorization: "Bearer test-secret-value" }))).toBe(
      true,
    );
  });
});
