import { beforeEach, describe, expect, it } from "bun:test";
import { NextRequest } from "next/server";
import { setCurrentUser, setRefreshesSession } from "./helpers/supabase";

/**
 * The proxy: the rate limit and the auth guards.
 *
 * This is the boundary the requests cross, and it decides who may reach
 * `/profile` and who may hammer the API. It had no test at all.
 */

const { proxy } = await import("@/proxy");

/**
 * A fresh address per run.
 *
 * The rate limit is per address and the proxy keeps its map in the module —
 * which survives the second run of this file, so an address that is used
 * twice would start the second run one request down.
 */
const RUN = Math.random().toString(36).slice(2, 8);

/** An address that nothing else in this file uses. */
function address(n: number): string {
  return `${RUN}-${n}`;
}

/** A request, as the proxy sees it. */
function request(path: string, ip = address(0)): NextRequest {
  return new NextRequest(new URL(path, "https://hybridized.online"), {
    headers: { "x-forwarded-for": `${ip}, 10.0.0.1` },
  });
}

beforeEach(() => {
  setCurrentUser(null);
  setRefreshesSession(true);
});

describe("the rate limit", () => {
  it("lets a request through and says how much is left", async () => {
    const response = await proxy(request("/api/v1/episodes", address(10)));

    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("answers 429 after a hundred requests in the window", async () => {
    const ip = address(20);

    for (let i = 0; i < 100; i++) {
      await proxy(request("/api/v1/episodes", ip));
    }

    const response = await proxy(request("/api/v1/episodes", ip));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Rate limit exceeded" });
    expect(response.headers.get("Retry-After")).toBeTruthy();
  });

  it("counts each address on its own", async () => {
    for (let i = 0; i < 100; i++) {
      await proxy(request("/api/v1/episodes", address(30)));
    }

    const response = await proxy(request("/api/v1/episodes", address(31)));

    expect(response.status).toBe(200);
  });

  it("does not rate limit a page", async () => {
    for (let i = 0; i < 120; i++) {
      const response = await proxy(request("/about", address(40)));
      expect(response.status).not.toBe(429);
    }
  });
});

describe("the auth guards", () => {
  it("sends a signed-out visitor to the login page", async () => {
    const response = await proxy(request("/profile"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/auth/login");
  });

  it("says where the visitor was going", async () => {
    const response = await proxy(request("/profile"));

    expect(response.headers.get("location")).toContain("redirectTo=%2Fprofile");
  });

  it("lets a signed-in visitor reach the protected page", async () => {
    setCurrentUser({ id: "user-1" });

    const response = await proxy(request("/profile"));

    expect(response.status).toBe(200);
  });

  it("sends a signed-in visitor away from the login page", async () => {
    setCurrentUser({ id: "user-1" });

    const response = await proxy(request("/auth/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toContain("/home");
  });

  it("leaves a signed-out visitor on the login page", async () => {
    const response = await proxy(request("/auth/login"));

    expect(response.status).toBe(200);
  });

  it("does not guard an API request", async () => {
    // The API has its own authorisation — the sync endpoints check the
    // shared secret — and the proxy must not redirect it to a login page.
    const response = await proxy(request("/api/v1/episodes", address(50)));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("refreshes the session and writes the new cookie back", async () => {
    // `@supabase/ssr` renews the access token when it is expired, and the
    // proxy has to put the new cookie on the response — otherwise the visitor
    // is signed out on the next request.
    const response = await proxy(request("/about", address(60)));

    expect(response.cookies.get("sb-access-token")?.value).toBe("refreshed");
  });
});
