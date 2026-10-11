import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SEARCH_RESULT_LIMIT, normalizeSearchQuery } from "@/lib/search";
import type { Database } from "@/lib/types/database.types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { SearchResults } from "./search-results";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Search",
  description: "Search the Hybridized archive for DJ mixes, radio shows, artists and episodes.",
};

type EpisodeRow = Database["public"]["Tables"]["episodes"]["Row"] & {
  bands?: {
    id: number;
    name: string;
    cover_url?: string;
    firstory_user_id?: string;
  } | null;
};

// Row shape returned by the search_episodes RPC (see
// supabase/migrations/20261011000001_search_episodes.sql). The cookie-based
// server client is untyped, so the mapping is annotated explicitly.
type SearchEpisodeRow = Database["public"]["Functions"]["search_episodes"]["Returns"][number];

async function SearchContent({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";
  const supabase = await createClient();

  let results = [];
  let error = null;

  if (query.trim()) {
    // Filtering runs in Postgres (search_episodes RPC): only the matching
    // page of rows crosses the wire instead of the whole table.
    const { data, error: fetchError } = await supabase.rpc("search_episodes", {
      search_query: normalizeSearchQuery(query),
      result_limit: SEARCH_RESULT_LIMIT,
    });

    results = (data ?? []).map(
      (row: SearchEpisodeRow): EpisodeRow => ({
        id: row.id,
        episode_id: row.episode_id,
        title: row.title,
        description: row.description,
        audio_url: row.audio_url,
        cover_url: row.cover_url,
        duration: row.duration,
        pub_date: row.pub_date,
        band_id: row.band_id,
        link: row.link,
        audio_length: row.audio_length,
        creator: row.creator,
        explicit: row.explicit,
        guid: row.guid,
        enclosure_type: row.enclosure_type,
        created_at: row.created_at,
        bands:
          row.band_id === null
            ? null
            : {
                id: row.band_id,
                name: row.band_name ?? "",
                cover_url: row.band_cover_url ?? undefined,
                firstory_user_id: row.band_firstory_user_id ?? undefined,
              },
      }),
    );
    error = fetchError;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Link
        href="/home"
        className="fixed top-6 left-6 flex items-center gap-2 text-purple-300/80 hover:text-white transition-all group z-10"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
            Search Results
          </h1>

          {query && (
            <p className="text-white/70 mb-8">
              Showing results for:{" "}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                {query}
              </span>
            </p>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
              <p className="text-red-400">Error loading search results. Please try again.</p>
            </div>
          )}

          {!query.trim() ? (
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center hover:bg-white/10 transition-colors">
              <p className="text-white/70">Enter a search query to find mixes</p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-white/80 mb-6">Episodes</h2>
              <SearchResults results={results} query={query} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center">
          <p className="text-white/70">Loading...</p>
        </div>
      }
    >
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
