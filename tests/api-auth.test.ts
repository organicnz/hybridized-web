import { afterEach, describe, expect, it } from "bun:test";
import { isSyncAuthorized } from "@/lib/api/auth";

function makeRequest(headers: Record<string, string> = {}) {
  return new Request("https://hybridized.online/api/v1/sync-episodes", {
    method: "POST",
    headers,
  });
}

describe("isSyncAuthorized (shared secret path)", () => {
  const original = process.env.SYNC_SECRET;

  afterEach(() => {
    if (original === undefined) {
      Reflect.deleteProperty(process.env, "SYNC_SECRET");
    } else {
      process.env.SYNC_SECRET = original;
    }
  });

  it("accepts the configured bearer secret", async () => {
    process.env.SYNC_SECRET = "test-secret-value";
    expect(await isSyncAuthorized(makeRequest({ authorization: "Bearer test-secret-value" }))).toBe(
      true,
    );
  });

  it("rejects a wrong bearer secret", async () => {
    process.env.SYNC_SECRET = "test-secret-value";
    expect(await isSyncAuthorized(makeRequest({ authorization: "Bearer wrong" }))).toBe(false);
  });

  it("rejects a missing authorization header", async () => {
    process.env.SYNC_SECRET = "test-secret-value";
    expect(await isSyncAuthorized(makeRequest())).toBe(false);
  });
});
