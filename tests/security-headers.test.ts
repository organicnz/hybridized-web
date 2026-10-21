import { describe, expect, it } from "bun:test";
import { existsSync } from "bun:fs";
import { join } from "bun:path";
import config from "@/next.config";

/**
 * The security headers.
 *
 * They are the app's outermost defence, and they are set in a configuration
 * file that no test touched. A header that is dropped — or a policy that is
 * loosened by accident — is invisible until something is attacked.
 */

/** The headers, as a map. */
async function headers(): Promise<Map<string, string>> {
  const rules = (await config.headers?.()) ?? [];
  const all = rules.flatMap((rule) => rule.headers ?? []);

  return new Map(all.map((header) => [header.key, header.value]));
}

describe("the security headers", () => {
  it("are set on every route", async () => {
    const rules = (await config.headers?.()) ?? [];

    expect(rules).toHaveLength(1);
    expect(rules[0]?.source).toBe("/(.*)");
  });

  it("include the ones that matter", async () => {
    const all = await headers();

    for (const key of [
      "X-Frame-Options",
      "X-Content-Type-Options",
      "Referrer-Policy",
      "Strict-Transport-Security",
      "Permissions-Policy",
      "Cross-Origin-Opener-Policy",
      "Content-Security-Policy-Report-Only",
    ]) {
      expect(all.has(key)).toBe(true);
    }
  });

  it("are the strict values", async () => {
    const all = await headers();

    expect(all.get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(all.get("X-Content-Type-Options")).toBe("nosniff");
    expect(all.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(all.get("Permissions-Policy")).toBe("camera=(), microphone=(), geolocation=()");
    expect(all.get("Strict-Transport-Security")).toContain("max-age=63072000");
  });
});

describe("the content security policy", () => {
  it("reports to a route that exists", async () => {
    const all = await headers();
    const policy = all.get("Content-Security-Policy-Report-Only") ?? "";
    const reportUri = /report-uri (\S+)/.exec(policy)?.[1];

    expect(reportUri).toBe("/api/csp-report");
    expect(existsSync(join("app", reportUri ?? "", "route.ts"))).toBe(true);
  });

  it("allows the origins the app talks to", async () => {
    const all = await headers();
    const policy = all.get("Content-Security-Policy-Report-Only") ?? "";

    // The database, the feed the episodes come from, the CDN the audio is
    // served from, and the error reporting.
    expect(policy).toContain("connect-src");
    expect(policy).toContain("supabase.co");
    expect(policy).toContain("feed.firstory.me");
    expect(policy).toContain("d3mww1g1pfq2pt.cloudfront.net");
    expect(policy).toContain("sentry.io");
  });

  it("allows the player to embed the streams", async () => {
    const all = await headers();
    const policy = all.get("Content-Security-Policy-Report-Only") ?? "";

    expect(policy).toContain("frame-src");
    expect(policy).toContain("open.firstory.me");
  });

  it("does not allow the page to be framed by anyone else", async () => {
    const all = await headers();
    const policy = all.get("Content-Security-Policy-Report-Only") ?? "";

    // The policy is reported rather than enforced, so the protection is the
    // header — but the policy says the same thing, for when it is enforced.
    expect(policy).toContain("frame-ancestors 'self'");
    expect(all.get("X-Frame-Options")).toBe("SAMEORIGIN");
  });

  it("is reported rather than enforced", async () => {
    const all = await headers();

    // A policy with 'unsafe-inline' in script-src cannot be enforced without
    // breaking the app, so it reports and the headers do the enforcing.
    expect(all.has("Content-Security-Policy-Report-Only")).toBe(true);
    expect(all.has("Content-Security-Policy")).toBe(false);
  });
});
