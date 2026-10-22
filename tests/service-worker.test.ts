import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { readFileSync } from "bun:fs";

/**
 * The service worker.
 *
 * It exists for one thing: a DJ set is tens of megabytes, and a visitor
 * who plays the same one twice should not download it twice.
 *
 * The part that has to be right is everything else. A worker that answers a
 * request from the cache when it should not does not show a stale picture: it
 * shows stale *data*. The previous version cached the database's responses,
 * and an artist's list came from the cache and stayed there.
 *
 * The worker is a browser script, so the test gives it the three globals it
 * uses — `self`, `caches` and `fetch` — and fires the events at it.
 */

interface Recorded {
  url: string;
  method: string;
}

type Handler = (event: unknown) => void;

const handlers = new Map<string, Handler[]>();
const cacheEntries = new Map<string, Recorded[]>();
const fetched: Recorded[] = [];
let cachedResponses = new Map<string, Response>();

/** The cache the fake serves from and writes to. */
const fakeCaches = {
  async open(name: string) {
    return {
      async addAll(urls: string[]) {
        cacheEntries.set(
          name,
          urls.map((url) => ({ url, method: "GET" })),
        );
      },
      async match(request: { url: string }) {
        const entry = (cacheEntries.get(name) ?? []).find((item) => item.url === request.url);
        if (!entry) return undefined;
        return cachedResponses.get(request.url) ?? new Response("cached");
      },
      async put(request: { url: string }, response: Response) {
        cachedResponses.set(request.url, response);
        const entries = cacheEntries.get(name) ?? [];
        entries.push({ url: request.url, method: "GET" });
        cacheEntries.set(name, entries);
      },
      async delete(request: { url: string }) {
        const entries = (cacheEntries.get(name) ?? []).filter((item) => item.url !== request.url);
        cacheEntries.set(name, entries);
        cachedResponses.delete(request.url);
        return true;
      },
      async keys() {
        return (cacheEntries.get(name) ?? []).map((item) => ({ url: item.url }));
      },
    };
  },
  async keys() {
    return [...cacheEntries.keys()];
  },
  async delete(name: string) {
    cacheEntries.delete(name);
    cachedResponses.delete(name);
    return true;
  },
};

/** A request, as the worker sees it. */
function request(url: string, method = "GET"): { url: string; method: string } {
  return { url, method };
}

/** Fire an event at the worker and wait for what it waits for. */
async function fire(type: string, event: Record<string, unknown>): Promise<void> {
  const waiting: Promise<unknown>[] = [];

  const full = {
    ...event,
    waitUntil: (promise: Promise<unknown>) => waiting.push(promise),
  };

  for (const handler of handlers.get(type) ?? []) handler(full);
  await Promise.all(waiting);
}

/** Fire a fetch event and see what the worker answers with. */
async function fetchThrough(url: string, method = "GET"): Promise<Response | undefined> {
  let answered: Response | undefined;

  await fire("fetch", {
    request: request(url, method),
    respondWith: (response: Response) => {
      answered = response;
    },
  });

  return answered;
}

beforeEach(async () => {
  handlers.clear();
  cacheEntries.clear();
  fetched.length = 0;
  cachedResponses = new Map();

  globalThis.self = {
    addEventListener: (type: string, handler: Handler) => {
      const list = handlers.get(type) ?? [];
      list.push(handler);
      handlers.set(type, list);
    },
    skipWaiting: async () => {},
    clients: { claim: async () => {} },
  } as never;

  globalThis.caches = fakeCaches as never;

  globalThis.fetch = (async (url: string) => {
    fetched.push({ url: String(url), method: "GET" });
    return new Response("from the network", { status: 200 });
  }) as never;

  loadWorker();
});

/**
 * Run the worker, the way the browser loads it.
 *
 * It is a classic script rather than a module — the browser fetches it as a
 * file — so it is evaluated here rather than imported. Evaluating it afresh
 * each time matters: an imported module is only evaluated once, and this
 * file runs twice.
 */
function loadWorker(): void {
  const source = readFileSync("public/sw.js", "utf8");
  // The worker is a script the browser evaluates, so the test evaluates it
  // the same way. It is the worker's own source, read from this repository.
  // oxlint-disable-next-line typescript/no-implied-eval
  const evaluate = new Function(source) as () => void;
  evaluate();
}

afterEach(() => {
  Reflect.deleteProperty(globalThis, "self");
  Reflect.deleteProperty(globalThis, "caches");
});

describe("the service worker", () => {
  it("caches the audio", async () => {
    const url = "https://backend.endpoints.firstory-709db.cloud.goog/play.mp3?url=abc";
    const response = await fetchThrough(url);

    expect(response).toBeDefined();
    expect(fetched).toHaveLength(1);
    expect(cacheEntries.get("hybridized-audio-v5")?.map((entry) => entry.url)).toEqual([url]);
  });

  it("serves the audio from the cache the second time", async () => {
    const url = "https://backend.endpoints.firstory-709db.cloud.goog/play.mp3?url=abc";
    await fetchThrough(url);
    const second = await fetchThrough(url);

    expect(second).toBeDefined();
    // The second play did not go to the network.
    expect(fetched).toHaveLength(1);
  });

  it("does not touch the app's data", async () => {
    // The database's responses are the app's live state: a cached one is a
    // stale artist list, and the old worker cached them.
    const url = "https://neslxchdtibzhxijxcbg.supabase.co/rest/v1/bands?select=name";
    const response = await fetchThrough(url);

    expect(response).toBeUndefined();
    expect(fetched).toHaveLength(0);
    expect(cacheEntries.get("hybridized-audio-v5")).toBeUndefined();
  });

  it("does not touch the artwork", async () => {
    // The artwork is served from the same CDN as the audio, and only the
    // file says which is which.
    const url = "https://d3mww1g1pfq2pt.cloudfront.net/Image/cl3p/NvKL08.jpg";
    const response = await fetchThrough(url);

    expect(response).toBeUndefined();
    expect(fetched).toHaveLength(0);
  });

  it("does not touch the page", async () => {
    const response = await fetchThrough("https://hybridized.online/home");

    expect(response).toBeUndefined();
  });

  it("does not touch a request that is not a GET", async () => {
    const response = await fetchThrough("https://backend.endpoints.example/play.mp3", "POST");

    expect(response).toBeUndefined();
  });

  it("keeps only a handful of sets", async () => {
    for (let i = 0; i < 9; i++) {
      await fetchThrough(`https://backend.endpoints.example/play.mp3?set=${i}`);
    }

    const entries = cacheEntries.get("hybridized-audio-v5") ?? [];
    expect(entries.length).toBe(6);
    // The oldest went first.
    expect(entries[0]?.url).toContain("set=3");
  });

  it("drops the caches of the previous version", async () => {
    cacheEntries.set("hybridized-v4", [{ url: "/old", method: "GET" }]);
    cacheEntries.set("hybridized-audio-v4", [{ url: "/old.mp3", method: "GET" }]);

    await fire("activate", {});

    expect(cacheEntries.has("hybridized-v4")).toBe(false);
    expect(cacheEntries.has("hybridized-audio-v4")).toBe(false);
  });

  it("caches the few files that are always wanted", async () => {
    await fire("install", {});

    expect(cacheEntries.get("hybridized-v5")?.map((entry) => entry.url)).toEqual([
      "/logo.png",
      "/favicon.png",
    ]);
  });
});
