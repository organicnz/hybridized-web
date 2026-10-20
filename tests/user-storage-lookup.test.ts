import { describe, expect, it } from "bun:test";
import "./helpers/local-storage";
import { getUser, setCurrentUser } from "./helpers/supabase";

/**
 * The async storage resolves the user id from Supabase, and caches it.
 *
 * This test needs a *cold* cache — `lib/user-storage.ts` memoises the id in
 * the module, so once any other test has resolved it, the lookup does not
 * happen again. The suite runs with `bun test --isolate`, which gives every
 * test file a fresh module registry, so a file of its own is the only way to
 * observe the cold path. Hence this file holds exactly one test.
 */

describe("user-storage", () => {
  it("resolves the user id from Supabase", async () => {
    setCurrentUser({ id: "user-1" });

    const storage = await import("@/lib/user-storage");
    await storage.getUserStorageItem("language");

    expect(getUser).toHaveBeenCalledTimes(1);
  });
});
