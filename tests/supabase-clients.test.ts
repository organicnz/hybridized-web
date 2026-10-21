import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { createSupabaseClient } from "./helpers/supabase";

/**
 * The two Supabase clients that are not the request-scoped one.
 *
 * The service client bypasses row level security, so it is handed the
 * service-role key and *nothing else* — and it returns `null` when there is
 * no key, so the caller can fall back to the request-scoped client rather
 * than fail. The static client is the one the build uses.
 */

const ORIGINAL_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ORIGINAL_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ORIGINAL_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const ORIGINAL_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  createSupabaseClient.mockClear();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
});

afterEach(() => {
  const restore = (name: string, value: string | undefined): void => {
    if (value === undefined) Reflect.deleteProperty(process.env, name);
    else process.env[name] = value;
  };

  restore("NEXT_PUBLIC_SUPABASE_URL", ORIGINAL_URL);
  restore("NEXT_PUBLIC_SUPABASE_ANON_KEY", ORIGINAL_ANON_KEY);
  restore("SUPABASE_SECRET_KEY", ORIGINAL_SECRET_KEY);
  restore("SUPABASE_SERVICE_ROLE_KEY", ORIGINAL_SERVICE_ROLE_KEY);
});

describe("the service client", () => {
  it("is null when there is no service key", async () => {
    Reflect.deleteProperty(process.env, "SUPABASE_SECRET_KEY");
    Reflect.deleteProperty(process.env, "SUPABASE_SERVICE_ROLE_KEY");

    const { createServiceClient } = await import("@/lib/supabase/service");

    expect(createServiceClient()).toBeNull();
  });

  it("uses the secret key when there is one", async () => {
    process.env.SUPABASE_SECRET_KEY = "secret-key";
    Reflect.deleteProperty(process.env, "SUPABASE_SERVICE_ROLE_KEY");

    const { createServiceClient } = await import("@/lib/supabase/service");
    const client = createServiceClient();

    expect(client).not.toBeNull();
    expect(createSupabaseClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "secret-key",
      expect.anything(),
    );
  });

  it("falls back to the service role key", async () => {
    Reflect.deleteProperty(process.env, "SUPABASE_SECRET_KEY");
    process.env.SUPABASE_SERVICE_ROLE_KEY = "role-key";

    const { createServiceClient } = await import("@/lib/supabase/service");
    createServiceClient();

    expect(createSupabaseClient).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "role-key",
      expect.anything(),
    );
  });

  it("does not keep a session", async () => {
    process.env.SUPABASE_SECRET_KEY = "secret-key";

    const { createServiceClient } = await import("@/lib/supabase/service");
    createServiceClient();

    const options = createSupabaseClient.mock.calls.at(-1)?.[2] as
      { auth?: { persistSession?: boolean; autoRefreshToken?: boolean } } | undefined;

    expect(options?.auth?.persistSession).toBe(false);
    expect(options?.auth?.autoRefreshToken).toBe(false);
  });
});

describe("the static client", () => {
  it("is built with the public credentials", async () => {
    const { createStaticClient } = await import("@/lib/supabase/static");
    createStaticClient();

    expect(createSupabaseClient).toHaveBeenCalledWith("https://example.supabase.co", "anon-key");
  });
});
