import { describe, expect, it } from "bun:test";
import { createBrowserClient } from "./helpers/supabase";

/**
 * The browser Supabase client.
 *
 * The SDK is mocked (see `tests/helpers/supabase.ts`); everything between
 * `getSupabase()` and the SDK is the real thing.
 *
 * The suite runs with `bun test --isolate`, so this file starts with a fresh
 * module registry: the client's memo is cold, and no other test file can see
 * — or be seen by — this one.
 */

describe("supabase browser client", () => {
  it("creates the client with the public credentials", async () => {
    const { getSupabase } = await import("@/lib/supabase/client");
    await getSupabase();

    // The call is recorded even if another test in this file already
    // triggered the memo, so the assertion is order-independent.
    const call = createBrowserClient.mock.calls.at(-1);
    expect(call?.[0]).toBe(process.env.NEXT_PUBLIC_SUPABASE_URL);
    expect(call?.[1]).toBe(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  });

  it("memoises the client so the app shares one auth listener", async () => {
    const { getSupabase } = await import("@/lib/supabase/client");

    const first = getSupabase();
    const second = getSupabase();

    // The same promise, so the SDK is built once and never again.
    expect(first).toBe(second);

    // The SDK is imported asynchronously, so the call only lands once the
    // promise settles. The registry is fresh, so the factory has run exactly
    // once by now — whichever test in this file ran first.
    await first;
    expect(createBrowserClient.mock.calls.length).toBe(1);
  });
});
