import { describe, expect, it } from "bun:test";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  getLanguageByCode,
  isValidLanguageCode,
} from "@/lib/constants/languages";

describe("LANGUAGES", () => {
  it("has at least one language", () => {
    expect(LANGUAGES.length).toBeGreaterThan(0);
  });

  it("every language has a code, name, flag and locale", () => {
    for (const language of LANGUAGES) {
      expect(language.code.length).toBeGreaterThan(0);
      expect(language.name.length).toBeGreaterThan(0);
      expect(language.flag.length).toBeGreaterThan(0);
      expect(language.locale).toContain("-");
    }
  });

  it("has unique language codes", () => {
    const codes = LANGUAGES.map((language) => language.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe("DEFAULT_LANGUAGE", () => {
  it("is the first configured language", () => {
    expect(DEFAULT_LANGUAGE).toBe(LANGUAGES[0]);
  });
});

describe("getLanguageByCode", () => {
  it("returns the language for a valid code", () => {
    expect(getLanguageByCode("en")).toBe(LANGUAGES[0]);
  });

  it("returns undefined for an unknown code", () => {
    expect(getLanguageByCode("xx")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    expect(getLanguageByCode("EN")).toBeUndefined();
  });
});

describe("isValidLanguageCode", () => {
  it("returns true for valid codes", () => {
    for (const language of LANGUAGES) {
      expect(isValidLanguageCode(language.code)).toBe(true);
    }
  });

  it("returns false for invalid codes", () => {
    expect(isValidLanguageCode("xx")).toBe(false);
    expect(isValidLanguageCode("")).toBe(false);
  });
});
