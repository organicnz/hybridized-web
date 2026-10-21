import { afterEach, beforeEach, describe, expect, it, jest, mock } from "bun:test";
import "./helpers/local-storage";

/**
 * The settings saver.
 *
 * It holds the user's equalizer settings, and it holds them through a
 * debounce, a retry and an offline queue — so a bug in it loses what the
 * user set, quietly. The equalizer is the thing they came for.
 */

interface QueryResult {
  data?: unknown;
  error?: unknown;
}

interface Query {
  table: string;
  calls: string[];
  args: Record<string, unknown[]>;
}

let user: { id: string } | null = { id: "user-1" };
let selectResult: QueryResult = { data: null, error: null };
let writeResult: QueryResult = { error: null };
let queries: Query[] = [];

let toastCalls: Array<{ kind: "info" | "error"; message: string }> = [];
let onlineHandler: (() => void) | null = null;

/** The database, faked. The write fails or succeeds on demand. */
const supabase = {
  auth: {
    getUser: async () => ({ data: { user } }),
  },
  from(table: string) {
    const calls: string[] = [];
    const args: Record<string, unknown[]> = {};

    const record = (name: string, ...values: unknown[]): unknown => {
      calls.push(name);
      args[name] = values;
      return query;
    };

    const query = new Proxy({} as Record<string, unknown>, {
      get(_target, property) {
        if (property === "then") {
          return (onfulfilled?: (value: QueryResult) => unknown) =>
            Promise.resolve(calls.includes("select") ? selectResult : writeResult).then(
              onfulfilled as never,
            );
        }
        if (property === "calls") return calls;
        if (property === "args") return args;
        if (typeof property !== "string") return undefined;
        return (...values: unknown[]) => record(property, ...values);
      },
    });

    queries.push({ table, calls, args });
    return query;
  },
};

mock.module("@/lib/supabase/client", () => ({ getSupabase: async () => supabase }));
mock.module("sonner", () => ({
  toast: {
    info: (message: string) => toastCalls.push({ kind: "info", message }),
    error: (message: string) => toastCalls.push({ kind: "error", message }),
  },
}));

const { createSettingsSaver, loadUserSettings } = await import("@/lib/settings-utils");

/** Let the promises that are waiting settle. */
async function settle(): Promise<void> {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

/** Advance the clock, then let the work that was waiting run. */
async function advance(ms: number): Promise<void> {
  jest.advanceTimersByTime(ms);
  await settle();
}

/** The write the module made, if it made one. */
function write(): Query | undefined {
  return queries.find((query) => query.calls.includes("update") || query.calls.includes("insert"));
}

/** What the module wrote, whether it updated a row or inserted one. */
function writePayload(): Record<string, unknown> | undefined {
  const query = write();
  const payload = query?.args.update?.[0] ?? query?.args.insert?.[0];
  return payload as Record<string, unknown> | undefined;
}

beforeEach(() => {
  jest.useFakeTimers();
  user = { id: "user-1" };
  selectResult = { data: null, error: null };
  writeResult = { error: null };
  queries = [];
  toastCalls.length = 0;
  localStorage.clear();

  // Bun has no `navigator.onLine`, and the saver reads it to decide whether
  // the browser is online.
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true, writable: true });

  // Bun has no `window`, and the saver listens for the browser coming back
  // online on it.
  onlineHandler = null;
  Object.defineProperty(globalThis, "window", {
    value: {
      addEventListener: (type: string, handler: () => void) => {
        if (type === "online") onlineHandler = handler;
      },
    },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  jest.useRealTimers();
  Reflect.deleteProperty(globalThis, "window");
});

describe("createSettingsSaver", () => {
  it("waits for the debounce before it writes", async () => {
    const saver = createSettingsSaver();
    saver.save({ gains: [1, 2, 3] });

    await settle();
    expect(write()).toBeUndefined();

    await advance(500);
    expect(write()).toBeDefined();
  });

  it("merges the updates that arrive before the write", async () => {
    const saver = createSettingsSaver();
    saver.save({ gains: [1, 2, 3] });
    saver.save({ last_artist: "Alex Hall" });

    await advance(500);

    const payload = writePayload();
    expect(payload?.gains).toEqual([1, 2, 3]);
    expect(payload?.last_artist).toBe("Alex Hall");
  });

  it("updates the row when the user already has one", async () => {
    selectResult = { data: { id: 7 }, error: null };
    const saver = createSettingsSaver();

    saver.save({ gains: [1] });
    await advance(500);

    expect(write()?.calls).toContain("update");
    expect(write()?.calls).not.toContain("insert");
  });

  it("inserts when the user has no row yet", async () => {
    selectResult = { data: null, error: null };
    const saver = createSettingsSaver();

    saver.save({ gains: [1] });
    await advance(500);

    expect(write()?.calls).toContain("insert");
  });

  it("writes nothing when there is no user", async () => {
    user = null;
    const saver = createSettingsSaver();

    saver.save({ gains: [1] });
    await advance(500);

    expect(write()).toBeUndefined();
    expect(saver.getStatus()).toBe("idle");
  });

  it("queues the update while the browser is offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });

    const saver = createSettingsSaver();
    saver.save({ gains: [1] });
    await advance(500);

    expect(write()).toBeUndefined();
    expect(saver.getStatus()).toBe("pending");
    expect(localStorage.getItem("settings-offline-queue")).toContain("user-1");
    expect(toastCalls.some((call) => call.kind === "info")).toBe(true);
  });

  it("retries, and then reports the error", async () => {
    writeResult = { error: new Error("boom") };
    const saver = createSettingsSaver();

    saver.save({ gains: [1] });

    await advance(500);
    await advance(100);
    await advance(200);

    expect(saver.getStatus()).toBe("error");
    expect(toastCalls.some((call) => call.kind === "error")).toBe(true);
  });

  it("flushes the pending update at once", async () => {
    const saver = createSettingsSaver();
    saver.save({ gains: [1] });

    await saver.flush();

    expect(write()).toBeDefined();
    expect(saver.hasPending()).toBe(false);
  });

  it("drops the pending update when it is cancelled", async () => {
    const saver = createSettingsSaver();
    saver.save({ gains: [1] });

    expect(saver.hasPending()).toBe(true);
    saver.cancel();
    expect(saver.hasPending()).toBe(false);

    await advance(500);
    expect(write()).toBeUndefined();
  });

  it("reports the status to a subscriber at once", () => {
    const saver = createSettingsSaver();
    const seen: string[] = [];

    const unsubscribe = saver.onStatusChange((status) => seen.push(status));
    expect(seen).toEqual(["idle"]);

    saver.save({ gains: [1] });
    expect(seen).toContain("pending");

    unsubscribe();
    saver.cancel();
    expect(seen.filter((status) => status === "pending")).toHaveLength(1);
  });

  it("returns to idle once the save is confirmed", async () => {
    const saver = createSettingsSaver();
    saver.save({ gains: [1] });

    await advance(500);
    expect(saver.getStatus()).toBe("saved");

    await advance(1500);
    expect(saver.getStatus()).toBe("idle");
  });

  it("writes the volume and the last track too", async () => {
    const saver = createSettingsSaver();
    saver.save({ volume_settings: { master: 42 }, last_track: { id: "clabc123" } });

    await advance(500);

    const payload = writePayload();
    expect(payload?.volume_settings).toEqual({ master: 42 });
    expect(payload?.last_track).toEqual({ id: "clabc123" });
  });

  it("queues the update when the connection is lost during the retry", async () => {
    writeResult = { error: new Error("boom") };
    const saver = createSettingsSaver();

    saver.save({ gains: [1] });
    await advance(500);

    // The connection goes while the saver is retrying.
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });

    await advance(100);
    await advance(200);

    expect(saver.getStatus()).toBe("pending");
    expect(localStorage.getItem("settings-offline-queue")).toContain("user-1");
  });

  it("merges the queued updates for the same user", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });

    const saver = createSettingsSaver();
    saver.save({ gains: [1] });
    await advance(500);
    saver.save({ last_artist: "Alex Hall" });
    await advance(500);

    const queue = JSON.parse(localStorage.getItem("settings-offline-queue") ?? "[]");
    expect(queue).toHaveLength(1);
    expect(queue[0].updates.gains).toEqual([1]);
    expect(queue[0].updates.last_artist).toBe("Alex Hall");
  });

  it("writes the queued settings when the browser comes back online", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
      writable: true,
    });

    const saver = createSettingsSaver();
    saver.save({ gains: [1] });
    await advance(500);
    expect(write()).toBeUndefined();

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
      writable: true,
    });

    expect(onlineHandler).not.toBeNull();
    onlineHandler?.();
    await settle();

    expect(write()).toBeDefined();
    expect(localStorage.getItem("settings-offline-queue")).toBeNull();
  });
});

describe("loadUserSettings", () => {
  it("returns the user's settings", async () => {
    selectResult = {
      data: { gains: [1, 2], volume_settings: { master: 70 }, last_artist: null, last_track: null },
      error: null,
    };

    const settings = await loadUserSettings();

    expect(settings?.gains).toEqual([1, 2]);
    expect(settings?.volume_settings).toEqual({ master: 70 });
  });

  it("returns nothing when there is no user", async () => {
    user = null;

    expect(await loadUserSettings()).toBeNull();
  });

  it("returns nothing when the query fails", async () => {
    selectResult = { data: null, error: new Error("boom") };

    expect(await loadUserSettings()).toBeNull();
  });
});
