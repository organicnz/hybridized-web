import { describe, expect, it } from "bun:test";
import { existsSync } from "bun:fs";
import { join } from "bun:path";
import { SERVICE_WORKER_DISABLED_KEY, SERVICE_WORKER_URL } from "@/lib/service-worker";

/**
 * The service worker's contract with the app.
 *
 * The worker itself is tested in `tests/service-worker.test.ts`; this is the
 * two things the app and the static files have to agree on: where the worker
 * is served from, and the flag that turns it off.
 */

describe("the service worker", () => {
  it("is served from the path the app registers", () => {
    expect(existsSync(join("public", SERVICE_WORKER_URL))).toBe(true);
  });

  it("has an opt-out key", () => {
    expect(SERVICE_WORKER_DISABLED_KEY.length).toBeGreaterThan(0);
  });
});
