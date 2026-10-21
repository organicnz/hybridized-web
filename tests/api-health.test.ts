import { describe, expect, it, mock } from "bun:test";

/**
 * The two plain API routes.
 *
 * The health route is what a deployment check and a load balancer hit, and
 * the CSP report route is what the browser posts a policy violation to. Both
 * are public, and neither had a test.
 */

let databaseError: unknown = null;
let clientThrows = false;

/** The database, faked. `from(…).select(…).limit(…)` is the whole query. */
const supabase = {
  from: () => ({
    select: () => ({
      limit: async () => ({ error: databaseError }),
    }),
  }),
};

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (clientThrows) throw new Error("no client");
    return supabase;
  },
}));

const { GET } = await import("@/app/api/health/route");
const { POST } = await import("@/app/api/csp-report/route");

describe("GET /api/health", () => {
  it("answers ok when the database answers", async () => {
    databaseError = null;
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.database.status).toBe("connected");
    expect(typeof body.database.latencyMs).toBe("number");
  });

  it("is never cached", async () => {
    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe("no-store, max-age=0");
  });

  it("answers degraded when the database fails", async () => {
    databaseError = { message: "boom" };
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.database.status).toBe("error");
  });

  it("answers degraded when there is no client at all", async () => {
    clientThrows = true;
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");

    clientThrows = false;
  });
});

describe("POST /api/csp-report", () => {
  it("accepts a report", async () => {
    const response = await POST(
      new Request("http://localhost/api/csp-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "csp-report": {
            "document-uri": "https://hybridized.online/home",
            "violated-directive": "script-src",
          },
        }),
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ received: true });
  });

  it("rejects a body that is not JSON", async () => {
    const response = await POST(
      new Request("http://localhost/api/csp-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not json",
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ received: false });
  });

  it("rejects a body that is enormous", async () => {
    const response = await POST(
      new Request("http://localhost/api/csp-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ padding: "x".repeat(17 * 1024) }),
      }) as never,
    );

    expect(response.status).toBe(413);
  });
});
