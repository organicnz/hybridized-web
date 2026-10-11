import { describe, expect, it } from "bun:test";
import { isValidSlug, requiredSlug } from "@/lib/api/validation";

describe("isValidSlug", () => {
  it("accepts alphanumerics, hyphens and underscores", () => {
    expect(isValidSlug("cl3ps0kge021i01y69qhnf36d")).toBe(true);
    expect(isValidSlug("my-playlist_1")).toBe(true);
  });

  it("rejects empty, spaced or punctuated values", () => {
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("has space")).toBe(false);
    expect(isValidSlug("sla/sh")).toBe(false);
    expect(isValidSlug("q?=1")).toBe(false);
  });
});

describe("requiredSlug", () => {
  it("returns the value when present and valid", () => {
    const result = requiredSlug(new URLSearchParams({ userId: "abc_123" }), "userId");
    expect(result).toEqual({ ok: true, value: "abc_123" });
  });

  it("reports missing values", () => {
    const result = requiredSlug(new URLSearchParams(), "userId");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Missing userId");
  });

  it("reports invalid values", () => {
    const result = requiredSlug(new URLSearchParams({ userId: "bad value" }), "userId");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Invalid userId");
  });
});
