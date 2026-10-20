import { describe, expect, it } from "bun:test";
import { MAX_SEARCH_QUERY_LENGTH, SEARCH_RESULT_LIMIT, normalizeSearchQuery } from "@/lib/search";

describe("normalizeSearchQuery", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeSearchQuery("  hybrid  ")).toBe("hybrid");
  });

  it("caps the query at MAX_SEARCH_QUERY_LENGTH", () => {
    const long = `hybrid${"x".repeat(MAX_SEARCH_QUERY_LENGTH)}`;
    expect(normalizeSearchQuery(long)).toBe(long.slice(0, MAX_SEARCH_QUERY_LENGTH));
    expect(normalizeSearchQuery(long).length).toBe(MAX_SEARCH_QUERY_LENGTH);
  });

  it("leaves short queries untouched", () => {
    expect(normalizeSearchQuery("way out west")).toBe("way out west");
  });
});

describe("search constants", () => {
  it("requests a bounded page of results", () => {
    expect(SEARCH_RESULT_LIMIT).toBeGreaterThan(0);
    expect(SEARCH_RESULT_LIMIT).toBeLessThanOrEqual(100);
  });
});
