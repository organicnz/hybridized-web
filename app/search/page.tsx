import { ScrollReveal } from "@/components/scroll-reveal";
import { SEARCH_RESULT_LIMIT, normalizeSearchQuery } from "@/lib/search";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchResults } from "./search-results";

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

async function SearchContent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
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

    results = (data ?? []).map((row: SearchEpisodeRow): EpisodeRow => ({
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
    }));
    error = fetchError;
  }

  return (
    <div className="min-h-screen bg-background">
      <Link
        href="/home"
        className="fixed left-6 top-6 z-10 flex items-center gap-2 rounded-lg bg-card/70 px-3 py-2 text-sm text-muted-foreground backdrop-blur-md ring-1 ring-border transition-all hover:text-foreground group"
      >
        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="container mx-auto px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal variant="fade-up" delay={100} className="mb-8">
            <h1 className="gradient-text mb-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
              Search Results
            </h1>
          </ScrollReveal>

          {query && (
            <ScrollReveal variant="fade-up" delay={200} className="mb-8">
              <p className="text-muted-foreground">
                Showing results for: <span className="gradient-text font-semibold">{query}</span>
              </p>
            </ScrollReveal>
          )}

          {error && (
            <ScrollReveal variant="fade-up" delay={300} className="mb-8">
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                <p className="text-destructive">Error loading search results. Please try again.</p>
              </div>
            </ScrollReveal>
          )}

          {!query.trim() ? (
            <ScrollReveal variant="scale-up" delay={200} className="mx-auto max-w-xl">
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted-foreground">Enter a search query to find mixes</p>
              </div>
            </ScrollReveal>
          ) : (
            <>
              <ScrollReveal variant="fade-up" delay={200} className="mb-6">
                <h2 className="font-display text-2xl font-semibold text-foreground/80">Episodes</h2>
              </ScrollReveal>
              <ScrollReveal variant="fade-up" delay={300}>
                <SearchResults results={results} query={query} />
              </ScrollReveal>
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
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}
