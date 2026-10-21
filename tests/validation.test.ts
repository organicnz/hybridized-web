import { describe, expect, it } from "bun:test";
import { clampInteger, isValidSlug, requiredSlug } from "@/lib/api/validation";

describe("clampInteger", () => {
  it("reads a number", () => {
    expect(clampInteger("25", 50, 1, 100)).toBe(25);
  });

  it("uses the default when there is no value", () => {
    expect(clampInteger(null, 50, 1, 100)).toBe(50);
    expect(clampInteger(undefined, 50, 1, 100)).toBe(50);
    expect(clampInteger("", 50, 1, 100)).toBe(50);
  });

  it("uses the default when the value is not a number", () => {
    // `Math.max(NaN, 1)` is `NaN`, so a limit of "abc" would reach the
    // database as `NaN` if it were only clamped.
    expect(clampInteger("abc", 50, 1, 100)).toBe(50);
    expect(clampInteger("NaN", 50, 1, 100)).toBe(50);
  });

  it("keeps the value inside the range", () => {
    expect(clampInteger("0", 50, 1, 100)).toBe(1);
    expect(clampInteger("-5", 50, 1, 100)).toBe(1);
    expect(clampInteger("9999", 50, 1, 100)).toBe(100);
  });

  it("reads the number at the start of the value", () => {
    expect(clampInteger("12abc", 50, 1, 100)).toBe(12);
  });
});

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
