import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";

/**
 * The public API's contract.
 *
 * The handler is a Hono app behind the Vercel adapter, so it is called the
 * way Next.js calls it: with a `Request`, and the response is read back.
 *
 * Only the database is faked. The authorisation, the validation, the parsing
 * and the error handling are the real implementations.
 */

interface FakeResult {
  data: unknown;
  error: unknown;
  count?: number;
}

/**
 * What the database answers, given the table and the builder calls made on the
 * query. The same table is read and written by different endpoints, so the
 * calls are part of the question.
 */
type FakeResultFactory = (table: string, calls: string[]) => FakeResult;

interface FakeQuery {
  readonly table: string;
  readonly calls: string[];
  readonly args: Record<string, unknown[]>;
  then<TResult1 = FakeResult, TResult2 = never>(
    onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2>;
}

/**
 * A stand-in for the supabase-js query builder: chainable, and thenable.
 *
 * It is a proxy because a thenable is exactly what a builder is — `await
 * supabase.from(…).select(…)` awaits the builder — and a class or an object
 * with a `then` member is a thenable by accident, which the lint rule is right
 * to grumble about. The proxy also means the fake accepts any builder call,
 * so a new one in the handler does not break the tests.
 */
function fakeQuery(table: string, answer: (calls: string[]) => FakeResult): FakeQuery {
  const calls: string[] = [];
  const args: Record<string, unknown[]> = {};

  const query = new Proxy({} as FakeQuery, {
    get(_target, property) {
      if (property === "table") return table;
      if (property === "calls") return calls;
      if (property === "args") return args;

      if (property === "then") {
        return <TResult1 = FakeResult, TResult2 = never>(
          onfulfilled?: ((value: FakeResult) => TResult1 | PromiseLike<TResult1>) | null,
          onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
        ) => Promise.resolve(answer(calls)).then(onfulfilled, onrejected);
      }

      if (typeof property !== "string") return undefined;

      // Any other name is a builder call: record it, hand back the query.
      return (...values: unknown[]) => {
        calls.push(property);
        args[property] = values;
        return query;
      };
    },
  });

  return query;
}

interface FakeClient {
  queries: FakeQuery[];
  from(table: string): FakeQuery;
}

function fakeClient(result: FakeResult | FakeResultFactory): FakeClient {
  const queries: FakeQuery[] = [];
  return {
    queries,
    from(table: string) {
      const query = fakeQuery(table, (calls) =>
        typeof result === "function" ? result(table, calls) : result,
      );
      queries.push(query);
      return query;
    },
  };
}

let serverClient: FakeClient;
let serviceClient: FakeClient;
let serviceAvailable = true;

mock.module("@/lib/supabase/server", () => ({
  createClient: () => serverClient,
}));

mock.module("@/lib/supabase/service", () => ({
  createServiceClient: () => (serviceAvailable ? serviceClient : null),
}));

const { GET, POST } = await import("@/app/api/[[...route]]/route");

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_SECRET = process.env.SYNC_SECRET;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** An upstream response carrying a raw body, the way a feed arrives. */
function textResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { "Content-Type": "application/xml" } });
}

/** Point the global fetch at a stub for the duration of a test. */
function stubFetch(handler: (url: string) => Promise<Response>): void {
  globalThis.fetch = mock(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    return handler(url);
  }) as unknown as typeof fetch;
}

/** A minimal RSS feed with one episode, in the shape the parser expects. */
const FEED_XML = `<rss><channel>
<item>
  <title><![CDATA[Alex Hall - DJ Set At Blue Star]]></title>
  <description><![CDATA[A description]]></description>
  <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
  <guid>clabc123</guid>
  <link>https://open.firstory.me/story/clabc123</link>
  <enclosure url="https://cdn.example/a.mp3" type="audio/mpeg"/>
  <itunes:image href="https://img.example/a.jpg"/>
</item>
</channel></rss>`;

beforeEach(() => {
  serverClient = fakeClient({ data: [], error: null, count: 0 });
  serviceClient = fakeClient({ data: [], error: null, count: 0 });
  serviceAvailable = true;
  stubFetch(async () => textResponse(FEED_XML));
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  if (ORIGINAL_SECRET === undefined) {
    Reflect.deleteProperty(process.env, "SYNC_SECRET");
  } else {
    process.env.SYNC_SECRET = ORIGINAL_SECRET;
  }
});

describe("GET /api/v1/episodes", () => {
  it("returns the episodes with the pagination", async () => {
    serverClient = fakeClient({ data: [{ id: 1 }], error: null, count: 7 });

    const response = await GET(new Request("http://localhost/api/v1/episodes"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.episodes).toEqual([{ id: 1 }]);
    expect(body.pagination).toEqual({ limit: 50, offset: 0, total: 7 });
  });

  it("clamps the limit to 1..100 and the offset to zero or more", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/episodes?limit=9999&offset=-40"),
    );
    const body = await response.json();

    expect(body.pagination.limit).toBe(100);
    expect(body.pagination.offset).toBe(0);
  });

  it("rejects a bandId that is not a number", async () => {
    const response = await GET(new Request("http://localhost/api/v1/episodes?bandId=abc"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid bandId" });
  });

  it("filters by band when the bandId is a number", async () => {
    await GET(new Request("http://localhost/api/v1/episodes?bandId=42"));

    expect(serverClient.queries[0]?.calls).toContain("eq");
    expect(serverClient.queries[0]?.args.eq).toEqual(["band_id", 42]);
  });

  it("caches the response", async () => {
    const response = await GET(new Request("http://localhost/api/v1/episodes"));

    expect(response.headers.get("Cache-Control")).toBe("s-maxage=60, stale-while-revalidate=300");
  });

  it("answers 500 when the database fails", async () => {
    serverClient = fakeClient({ data: null, error: new Error("boom") });

    const response = await GET(new Request("http://localhost/api/v1/episodes"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });

  it("answers 500 when the driver fails with something that is not an Error", async () => {
    // Hono only hands an `Error` to the error handler, so a driver that
    // returns a plain object would otherwise take the whole request down.
    serverClient = fakeClient({ data: null, error: { message: "boom" } });

    const response = await GET(new Request("http://localhost/api/v1/episodes"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/v1/firstory-feed", () => {
  it("needs a userId", async () => {
    const response = await GET(new Request("http://localhost/api/v1/firstory-feed"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Invalid or missing userId" });
  });

  it("rejects a userId that is not a slug", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/firstory-feed?userId=../etc/passwd"),
    );

    expect(response.status).toBe(400);
  });

  it("returns the parsed episodes", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/firstory-feed?userId=cl3ps0kge021i01y69qhnf36d"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(body.episodes)).toBe(true);
    expect(body.episodes.length).toBe(1);
    expect(body.episodes[0].title).toContain("Alex Hall");
  });

  it("answers 404 when the upstream has no such feed", async () => {
    stubFetch(async () => jsonResponse({}, 404));

    const response = await GET(
      new Request("http://localhost/api/v1/firstory-feed?userId=cl3ps0kge021i01y69qhnf36d"),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "User feed not found" });
  });

  it("answers 500 when the upstream breaks", async () => {
    stubFetch(async () => jsonResponse({}, 503));

    const response = await GET(
      new Request("http://localhost/api/v1/firstory-feed?userId=cl3ps0kge021i01y69qhnf36d"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/v1/playlist-episodes", () => {
  it("needs a playlistId", async () => {
    const response = await GET(new Request("http://localhost/api/v1/playlist-episodes"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "playlistId is required" });
  });

  it("pulls the episode ids out of the playlist page, without duplicates", async () => {
    stubFetch(
      async () =>
        new Response(
          '<a href="/story/clabc123">a</a><a href="/story/cldef456">b</a><a href="/story/clabc123">c</a>',
          { status: 200 },
        ),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/playlist-episodes?playlistId=cl3rgq2bf02yx01y60bgy3jmo"),
    );
    const body = await response.json();

    expect(body.episodeIds).toEqual(["clabc123", "cldef456"]);
  });

  it("answers 500 when the playlist page breaks", async () => {
    stubFetch(async () => textResponse("", 500));

    const response = await GET(
      new Request("http://localhost/api/v1/playlist-episodes?playlistId=cl3rgq2bf02yx01y60bgy3jmo"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("GET /api/v1/episode/:id", () => {
  it("answers 404 when the episode is not in the feed", async () => {
    const response = await GET(new Request("http://localhost/api/v1/episode/clmissing"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Episode not found in feed" });
  });

  it("returns the episode when the feed has it", async () => {
    const response = await GET(new Request("http://localhost/api/v1/episode/clabc123"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.episodes).toHaveLength(1);
    expect(body.episodes[0].title).toBe("Alex Hall - DJ Set At Blue Star");
    expect(body.episodes[0].audioUrl).toBe("https://cdn.example/a.mp3");
  });

  it("answers 404 when the feed itself is gone", async () => {
    stubFetch(async () => textResponse("", 404));

    const response = await GET(new Request("http://localhost/api/v1/episode/clabc123"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Feed not found" });
  });

  it("answers 500 when the feed breaks", async () => {
    stubFetch(async () => textResponse("", 503));

    const response = await GET(new Request("http://localhost/api/v1/episode/clabc123"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("POST /api/v1/sync-episodes", () => {
  it("rejects a request with no authorisation", async () => {
    process.env.SYNC_SECRET = "test-secret";

    const response = await POST(
      new Request("http://localhost/api/v1/sync-episodes", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("rejects a request with the wrong secret", async () => {
    process.env.SYNC_SECRET = "test-secret";

    const response = await POST(
      new Request("http://localhost/api/v1/sync-episodes", {
        method: "POST",
        headers: { Authorization: "Bearer wrong" },
      }),
    );

    expect(response.status).toBe(401);
  });

  it("syncs when the shared secret matches", async () => {
    process.env.SYNC_SECRET = "test-secret";

    const response = await POST(
      new Request("http://localhost/api/v1/sync-episodes", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(serviceClient.queries[0]?.calls).toContain("upsert");
  });

  it("falls back to the request-scoped client when there is no service key", async () => {
    process.env.SYNC_SECRET = "test-secret";
    serviceAvailable = false;

    const response = await POST(
      new Request("http://localhost/api/v1/sync-episodes", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(200);
    expect(serverClient.queries[0]?.calls).toContain("upsert");
  });

  it("answers 500 when the feed breaks", async () => {
    process.env.SYNC_SECRET = "test-secret";
    stubFetch(async () => textResponse("", 503));

    const response = await POST(
      new Request("http://localhost/api/v1/sync-episodes", {
        method: "POST",
        headers: { Authorization: "Bearer test-secret" },
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });
});

describe("POST /api/v1/sync-playlists", () => {
  const BANDS = [
    { id: 1, name: "Alex Hall", iframe_url: "https://open.firstory.me/playlists/cl123" },
  ];

  /** A playlist upstream that answers with the given payload. */
  function stubPlaylist(payload: unknown, status = 200): void {
    stubFetch(async (url) =>
      url.includes("/api/playlists/") ? jsonResponse(payload, status) : textResponse(FEED_XML),
    );
  }

  function authorise(): Request {
    return new Request("http://localhost/api/v1/sync-playlists", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });
  }

  beforeEach(() => {
    process.env.SYNC_SECRET = "test-secret";
    serviceClient = fakeClient((table, calls) => {
      if (table === "bands") return { data: BANDS, error: null };
      if (calls.includes("update")) return { data: null, error: null };
      return { data: [], error: null };
    });
  });

  it("rejects a request with no authorisation", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/sync-playlists", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("answers 500 when the bands cannot be read", async () => {
    serviceClient = fakeClient({
      data: null,
      error: new Error("boom"),
    });

    const response = await POST(authorise());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });

  it("links the episodes a playlist lists", async () => {
    stubPlaylist({ episodes: [{ id: "clabc123" }, { id: "cldef456" }] });

    const response = await POST(authorise());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.totalMatched).toBe(2);
    expect(body.results).toEqual([{ band: "Alex Hall", episodes: 2 }]);

    const update = serviceClient.queries.find(
      (query) => query.table === "episodes" && query.calls.includes("update"),
    );
    expect(update?.args.update).toEqual([{ band_id: 1 }]);
    expect(update?.args.in).toEqual(["episode_id", ["clabc123", "cldef456"]]);
  });

  it("reads the episode ids from `items` as well as `episodes`", async () => {
    stubPlaylist({ items: [{ episode_id: "clabc123" }] });

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(1);
  });

  it("reads the episode ids from `data` too", async () => {
    stubPlaylist({ data: [{ id: "clabc123" }] });

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(1);
  });

  it("reports a band whose playlist URL has no playlist in it", async () => {
    serviceClient = fakeClient((table) =>
      table === "bands"
        ? {
            data: [{ id: 1, name: "Alex Hall", iframe_url: "https://example.test/other" }],
            error: null,
          }
        : { data: [], error: null },
    );

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(0);
    expect(body.results).toEqual([{ band: "Alex Hall", error: "Invalid playlist URL" }]);
  });

  it("reports a band whose playlist upstream fails", async () => {
    stubPlaylist({}, 404);

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(0);
    expect(body.results).toEqual([{ band: "Alex Hall", error: "HTTP 404" }]);
  });

  it("reports a band whose playlist lists nothing", async () => {
    stubPlaylist({ episodes: [] });

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(0);
    expect(body.results).toEqual([{ band: "Alex Hall", episodes: 0 }]);
  });

  it("reports a band whose episodes cannot be linked", async () => {
    stubPlaylist({ episodes: [{ id: "clabc123" }] });
    serviceClient = fakeClient((table, calls) => {
      if (table === "bands") return { data: BANDS, error: null };
      if (calls.includes("update")) return { data: null, error: new Error("boom") };
      return { data: [], error: null };
    });

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.totalMatched).toBe(0);
    expect(body.results).toEqual([{ band: "Alex Hall", error: "Failed to link episodes" }]);
  });
});

describe("POST /api/v1/match-episodes", () => {
  const MATCH_BANDS = [
    { id: 1, name: "Alex Hall" },
    { id: 2, name: "wayoutwest" },
    { id: 3, name: "benz & md" },
  ];

  const MATCH_EPISODES = [
    { id: 10, title: "Alex Hall - DJ Set At Blue Star" },
    { id: 11, title: "Live Set - Way Out West" },
    { id: 12, title: "Benz and MD Live" },
    { id: 13, title: "An Unrelated Set" },
  ];

  function authorise(): Request {
    return new Request("http://localhost/api/v1/match-episodes", {
      method: "POST",
      headers: { Authorization: "Bearer test-secret" },
    });
  }

  beforeEach(() => {
    process.env.SYNC_SECRET = "test-secret";
    serviceClient = fakeClient((table, calls) => {
      if (table === "bands") return { data: MATCH_BANDS, error: null };
      if (calls.includes("select")) return { data: MATCH_EPISODES, error: null };
      return { data: null, error: null };
    });
  });

  it("rejects a request with no authorisation", async () => {
    const response = await POST(
      new Request("http://localhost/api/v1/match-episodes", { method: "POST" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });

  it("answers 500 when the bands cannot be read", async () => {
    serviceClient = fakeClient({ data: null, error: new Error("boom") });

    const response = await POST(authorise());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });

  it("answers 500 when the episodes cannot be read", async () => {
    serviceClient = fakeClient((table) =>
      table === "bands"
        ? { data: MATCH_BANDS, error: null }
        : { data: null, error: new Error("boom") },
    );

    const response = await POST(authorise());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "Internal server error" });
  });

  it("matches an episode to the band named in its title", async () => {
    const response = await POST(authorise());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.matched).toBe(3);
    expect(body.total).toBe(4);

    const updates = serviceClient.queries.filter(
      (query) => query.table === "episodes" && query.calls.includes("update"),
    );
    expect(updates).toHaveLength(3);
    expect(updates[0]?.args.in).toEqual(["id", [10]]);
    // "way out west" is spelled out in the title, the band is "wayoutwest".
    expect(updates[1]?.args.in).toEqual(["id", [11]]);
    // "benz and md" is spelled out in the title, the band is "benz & md".
    expect(updates[2]?.args.in).toEqual(["id", [12]]);
  });

  it("matches nothing when no band is named in the titles", async () => {
    serviceClient = fakeClient((table, calls) => {
      if (table === "bands") return { data: MATCH_BANDS, error: null };
      if (calls.includes("select"))
        return { data: [{ id: 13, title: "An Unrelated Set" }], error: null };
      return { data: null, error: null };
    });

    const response = await POST(authorise());
    const body = await response.json();

    expect(body.matched).toBe(0);
    expect(body.total).toBe(1);
  });
});
