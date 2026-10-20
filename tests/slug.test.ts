import { describe, expect, it } from "bun:test";
import { slugify, slugifyEncoded } from "@/lib/utils/slug";

describe("slugify", () => {
  it("lowercases the name", () => {
    expect(slugify("ALEX HALL")).toBe("alex-hall");
  });

  it("replaces whitespace with hyphens", () => {
    expect(slugify("Alex Hall")).toBe("alex-hall");
    expect(slugify("Andrew   Kelly")).toBe("andrew-kelly");
  });

  it("replaces slashes with hyphens", () => {
    expect(slugify("AC/DC")).toBe("ac-dc");
  });

  it("collapses repeated hyphens", () => {
    expect(slugify("A - B")).toBe("a-b");
    expect(slugify("A -- B")).toBe("a-b");
  });

  it("handles ampersands and special characters", () => {
    expect(slugify("Benz & MD")).toBe("benz-&-md");
  });

  it("trims leading and trailing hyphens", () => {
    expect(slugify(" Hybrid ")).toBe("hybrid");
  });
});

describe("slugifyEncoded", () => {
  it("URI-encodes the slug", () => {
    expect(slugifyEncoded("Benz & MD")).toBe("benz-%26-md");
  });

  it("keeps simple slugs unchanged", () => {
    expect(slugifyEncoded("Alex Hall")).toBe("alex-hall");
  });
});
