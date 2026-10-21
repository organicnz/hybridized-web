import { beforeEach, describe, expect, it, mock } from "bun:test";
import { NextRequest } from "next/server";

/**
 * The auth routes.
 *
 * The callback is where a sign-in lands, and it decides where the visitor
 * goes next — so the open-redirect guard matters: a `next` that is not a
 * path on this site must not be followed.
 */

let exchangeError: unknown = null;
let signedOut = false;

mock.module("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      exchangeCodeForSession: async (_code: string) => ({
        data: { session: null },
        error: exchangeError,
      }),
      signOut: async () => {
        signedOut = true;
        return { error: null };
      },
    },
  }),
}));

const { GET } = await import("@/app/auth/callback/route");
const { POST } = await import("@/app/auth/logout/route");

/** A request to the callback. */
function callback(query: string): NextRequest {
  return new NextRequest(new URL(`/auth/callback?${query}`, "https://hybridized.online"));
}

beforeEach(() => {
  exchangeError = null;
  signedOut = false;
});

describe("GET /auth/callback", () => {
  it("exchanges the code and goes to the home page", async () => {
    const response = await GET(callback("code=abc"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://hybridized.online/home");
  });

  it("goes where the caller asked", async () => {
    const response = await GET(callback("code=abc&next=/profile"));

    expect(response.headers.get("location")).toBe("https://hybridized.online/profile");
  });

  it("does not follow a redirect to another site", async () => {
    // The open-redirect guard: `next` has to be a path on this site.
    const response = await GET(callback("code=abc&next=https://example.com/steal"));

    expect(response.headers.get("location")).toBe("https://hybridized.online/home");
  });

  it("does not follow a protocol-relative redirect", async () => {
    const response = await GET(callback("code=abc&next=//example.com/steal"));

    expect(response.headers.get("location")).toBe("https://hybridized.online/home");
  });

  it("goes to the confirmation page for a signup", async () => {
    const response = await GET(callback("code=abc&type=signup"));

    expect(response.headers.get("location")).toContain("/auth/confirm-email?confirmed=true");
  });

  it("goes to the login page when there is no code", async () => {
    const response = await GET(callback(""));

    expect(response.headers.get("location")).toBe(
      "https://hybridized.online/auth/login?error=auth_callback_failed",
    );
  });

  it("goes to the login page when the exchange fails", async () => {
    exchangeError = { message: "boom" };

    const response = await GET(callback("code=abc"));

    expect(response.headers.get("location")).toBe(
      "https://hybridized.online/auth/login?error=auth_callback_failed",
    );
  });
});

describe("POST /auth/logout", () => {
  it("signs out and goes to the login page", async () => {
    const response = await POST(
      new NextRequest(new URL("/auth/logout", "https://hybridized.online"), { method: "POST" }),
    );

    expect(signedOut).toBe(true);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://hybridized.online/auth/login");
  });
});
