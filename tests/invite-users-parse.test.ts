import { describe, expect, it } from "bun:test";
import { parseEmails } from "@/supabase/functions/invite-users/parse";

/**
 * The invite request's email list.
 *
 * The list arrives from a text area, so it has spaces, blank lines and
 * whatever else was pasted into it. The provider and the check for an
 * address that already has an account both see the trimmed address, so it
 * has to be trimmed here.
 */

describe("parseEmails", () => {
  it("reads a list of addresses", () => {
    expect(parseEmails({ emails: ["a@example.com", "b@example.com"] })).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("trims the spaces", () => {
    expect(parseEmails({ emails: ["  a@example.com  ", "\tb@example.com\n"] })).toEqual([
      "a@example.com",
      "b@example.com",
    ]);
  });

  it("drops what is not an address", () => {
    expect(parseEmails({ emails: ["a@example.com", "not an address", "", 42] })).toEqual([
      "a@example.com",
    ]);
  });

  it("is null when there is no list", () => {
    expect(parseEmails({})).toBeNull();
    expect(parseEmails({ emails: "a@example.com" })).toBeNull();
    expect(parseEmails({ emails: null })).toBeNull();
  });

  it("is null when the list has nothing usable in it", () => {
    expect(parseEmails({ emails: [] })).toBeNull();
    expect(parseEmails({ emails: ["not an address"] })).toBeNull();
  });
});
