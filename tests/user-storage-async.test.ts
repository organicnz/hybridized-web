import { beforeEach, describe, expect, it, mock } from "bun:test";
import { localStorage } from "./helpers/local-storage";
import { getUser, setCurrentUser } from "./helpers/supabase";

/**
 * The async half of the user-scoped storage, for a signed-in user.
 *
 * The async API resolves the user id from Supabase, which the sync API does
 * not. Only the SDK boundary is mocked (see `tests/helpers/supabase.ts`), so
 * `lib/supabase/client.ts` and `lib/user-storage.ts` both run unmodified.
 *
 * The signed-out case lives in `user-storage-anonymous.test.ts`: the user id
 * is cached in the module, so the two cases cannot share a registry.
 */

describe("user-storage (async, signed in)", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUser({ id: "user-1" });
    mock.clearAllMocks();
  });

  it("scopes a write by the user id Supabase reports", async () => {
    const storage = await import("@/lib/user-storage");
    await storage.setUserStorageItem("language", "en");

    expect(localStorage.getItem("user-1:language")).toBe("en");
  });

  it("reads back the scoped value", async () => {
    const storage = await import("@/lib/user-storage");
    await storage.setUserStorageItem("language", "en");

    expect(await storage.getUserStorageItem("language")).toBe("en");
  });

  it("removes the scoped value", async () => {
    const storage = await import("@/lib/user-storage");
    await storage.setUserStorageItem("language", "en");
    await storage.removeUserStorageItem("language");

    expect(await storage.getUserStorageItem("language")).toBeNull();
  });

  it("migrates an unscoped key into the user's scope", async () => {
    localStorage.setItem("recentSearches", "legacy");
    const storage = await import("@/lib/user-storage");
    await storage.migrateToUserStorage(["recentSearches"]);

    expect(localStorage.getItem("user-1:recentSearches")).toBe("legacy");
    expect(localStorage.getItem("recentSearches")).toBeNull();
  });

  it("reuses the cached user id instead of asking Supabase again", async () => {
    const storage = await import("@/lib/user-storage");

    await storage.getUserStorageItem("a");
    const callsAfterFirst = getUser.mock.calls.length;

    await storage.getUserStorageItem("b");

    // The id is cached in the module, so the second read does not go back to
    // Supabase. Asserted as a delta so it holds whichever test ran first.
    expect(getUser.mock.calls.length).toBe(callsAfterFirst);
  });
});
