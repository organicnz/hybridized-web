import { beforeEach, describe, expect, it, mock } from "bun:test";
import { createServerClient } from "./helpers/supabase";

/**
 * The server Supabase client.
 *
 * `next/headers` is mocked here and the SDK is mocked in the shared helper,
 * so the cookie adapter — the part that actually has behaviour — is
 * exercised without a request or a database.
 */

interface Cookie {
  name: string;
  value: string;
  options?: Record<string, unknown>;
}

interface CookieStore {
  getAll(): Cookie[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

function createCookieStore(): CookieStore {
  const store = new Map<string, Cookie>();
  return {
    getAll: () => [...store.values()],
    set(name, value, options) {
      store.set(name, { name, value, options });
    },
  };
}

let cookieStore: CookieStore = createCookieStore();

mock.module("next/headers", () => ({
  cookies: () => Promise.resolve(cookieStore),
}));

const { createClient } = await import("@/lib/supabase/server");

/** The options the SDK was handed — the cookie adapter lives in there. */
function capturedAdapter(): {
  getAll(): Cookie[];
  setAll(cookiesToSet: Cookie[]): void;
} {
  const options = createServerClient.mock.calls.at(-1)?.[2] as
    { cookies: { getAll(): Cookie[]; setAll(cookiesToSet: Cookie[]): void } } | undefined;

  if (!options) {
    throw new Error("createServerClient was not called");
  }

  return options.cookies;
}

describe("supabase server client", () => {
  beforeEach(() => {
    cookieStore = createCookieStore();
    mock.clearAllMocks();
  });

  it("returns the client the SDK built", async () => {
    // The SDK is mocked, so the runtime value is the fake client's shape —
    // not the `SupabaseClient` the real SDK would return.
    const client = (await createClient()) as unknown as { id: string };
    expect(client.id).toBe("fake-server-client");
  });

  it("passes the public credentials to the SDK", async () => {
    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      expect.anything(),
    );
  });

  it("reads the request cookies through getAll", async () => {
    cookieStore.set("sb-access-token", "token-1");
    cookieStore.set("sb-refresh-token", "token-2");

    await createClient();
    const cookies = capturedAdapter().getAll();

    expect(cookies.map((cookie) => cookie.name)).toEqual(["sb-access-token", "sb-refresh-token"]);
    expect(cookies[0]?.value).toBe("token-1");
  });

  it("writes cookies back through setAll", async () => {
    await createClient();
    capturedAdapter().setAll([
      { name: "sb-access-token", value: "fresh", options: { path: "/", httpOnly: true } },
    ]);

    const written = cookieStore.getAll();
    expect(written).toHaveLength(1);
    expect(written[0]?.name).toBe("sb-access-token");
    expect(written[0]?.value).toBe("fresh");
    expect(written[0]?.options).toEqual({ path: "/", httpOnly: true });
  });

  it("swallows the error when the store refuses to set a cookie", async () => {
    // Server Components cannot set cookies. The adapter must not turn that
    // into an unhandled rejection — the refresh handler is best-effort.
    cookieStore = {
      getAll: () => [],
      set() {
        throw new Error("Cookies can only be modified in a Server Action or Route Handler");
      },
    };

    await createClient();

    expect(() =>
      capturedAdapter().setAll([{ name: "sb-access-token", value: "fresh" }]),
    ).not.toThrow();
  });
});
