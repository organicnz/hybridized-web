import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { localStorage } from "./helpers/local-storage";

import {
  clearCurrentUserStorage,
  getUserStorageItemSync,
  migrateToUserStorage,
  removeUserStorageItemSync,
  setCurrentUserId,
  setUserStorageItemSync,
} from "@/lib/user-storage";

describe("user-storage", () => {
  beforeEach(() => {
    localStorage.clear();
    setCurrentUserId(null); // → 'anonymous'
  });

  afterEach(() => {
    localStorage.clear();
    setCurrentUserId(null);
  });

  it("scopes keys by user id", () => {
    setCurrentUserId("user-1");
    setUserStorageItemSync("hybridized-audio-state", "a");
    setCurrentUserId("user-2");
    setUserStorageItemSync("hybridized-audio-state", "b");

    expect(localStorage.getItem("user-1:hybridized-audio-state")).toBe("a");
    expect(localStorage.getItem("user-2:hybridized-audio-state")).toBe("b");
  });

  it("reads back the scoped value", () => {
    setCurrentUserId("user-1");
    setUserStorageItemSync("recentSearches", JSON.stringify(["x"]));
    expect(getUserStorageItemSync("recentSearches")).toBe('["x"]');
  });

  it("falls back to anonymous when no user is set", () => {
    setUserStorageItemSync("language", "en");
    expect(localStorage.getItem("anonymous:language")).toBe("en");
  });

  it("removes scoped items", () => {
    setCurrentUserId("user-1");
    setUserStorageItemSync("language", "en");
    removeUserStorageItemSync("language");
    expect(getUserStorageItemSync("language")).toBeNull();
  });

  it("clears all keys for the current user but not other users", () => {
    setCurrentUserId("user-1");
    setUserStorageItemSync("a", "1");
    setUserStorageItemSync("b", "2");
    setCurrentUserId("user-2");
    setUserStorageItemSync("a", "3");

    setCurrentUserId("user-1");
    clearCurrentUserStorage();

    expect(localStorage.getItem("user-1:a")).toBeNull();
    expect(localStorage.getItem("user-1:b")).toBeNull();
    expect(localStorage.getItem("user-2:a")).toBe("3");
  });

  it("does not clear anonymous storage", () => {
    setCurrentUserId(null);
    setUserStorageItemSync("anon-key", "keep");
    clearCurrentUserStorage();
    expect(localStorage.getItem("anonymous:anon-key")).toBe("keep");
  });

  it("migrates unscoped keys to the user's scope", async () => {
    localStorage.setItem("recentSearches", "legacy-value");
    setCurrentUserId("user-1");
    await migrateToUserStorage(["recentSearches"]);

    expect(localStorage.getItem("user-1:recentSearches")).toBe("legacy-value");
    expect(localStorage.getItem("recentSearches")).toBeNull();
  });

  it("keeps unscoped keys when anonymous", async () => {
    localStorage.setItem("recentSearches", "legacy-value");
    setCurrentUserId(null);
    await migrateToUserStorage(["recentSearches"]);

    expect(localStorage.getItem("recentSearches")).toBe("legacy-value");
    expect(localStorage.getItem("anonymous:recentSearches")).toBeNull();
  });
});
