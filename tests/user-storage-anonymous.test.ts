import { beforeEach, describe, expect, it, mock } from "bun:test";
import { localStorage } from "./helpers/local-storage";
import { setCurrentUser } from "./helpers/supabase";

/**
 * The async half of the user-scoped storage, for a signed-out user.
 *
 * `lib/user-storage.ts` caches the user id in the module, so the signed-out
 * case needs a registry of its own — which `bun test --isolate` gives every
 * test file.
 */

describe("user-storage (async, signed out)", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUser(null);
    mock.clearAllMocks();
  });

  it("falls back to the anonymous scope when there is no user", async () => {
    const storage = await import("@/lib/user-storage");
    await storage.setUserStorageItem("language", "en");

    expect(localStorage.getItem("anonymous:language")).toBe("en");
    expect(localStorage.getItem("user-1:language")).toBeNull();
  });

  it("leaves an unscoped key alone when signed out", async () => {
    localStorage.setItem("recentSearches", "legacy");
    const storage = await import("@/lib/user-storage");
    await storage.migrateToUserStorage(["recentSearches"]);

    expect(localStorage.getItem("recentSearches")).toBe("legacy");
    expect(localStorage.getItem("anonymous:recentSearches")).toBeNull();
  });
});
