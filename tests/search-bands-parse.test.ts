import { describe, expect, it } from "bun:test";
import { DEFAULT_LIMIT, MAX_LIMIT, parseLimit } from "@/supabase/functions/search-bands/parse";

/**
 * The public band search's limit.
 *
 * The endpoint takes the limit from the query string, and it is public: a
 * caller must not be able to ask for the whole table, and a limit of `NaN`
 * is not a number the database understands.
 */

describe("parseLimit", () => {
  it("uses the default when the caller does not say", () => {
    expect(parseLimit(null)).toBe(DEFAULT_LIMIT);
    expect(parseLimit("")).toBe(DEFAULT_LIMIT);
  });

  it("uses the number the caller asked for", () => {
    expect(parseLimit("25")).toBe(25);
  });

  it("uses the default when the number is not one", () => {
    expect(parseLimit("abc")).toBe(DEFAULT_LIMIT);
    expect(parseLimit("NaN")).toBe(DEFAULT_LIMIT);
    expect(parseLimit("12abc")).toBe(12);
  });

  it("never asks for fewer than one", () => {
    expect(parseLimit("0")).toBe(DEFAULT_LIMIT);
    expect(parseLimit("-5")).toBe(DEFAULT_LIMIT);
  });

  it("never asks for more than a hundred", () => {
    expect(parseLimit("1000")).toBe(MAX_LIMIT);
    expect(parseLimit(String(MAX_LIMIT))).toBe(MAX_LIMIT);
  });
});
