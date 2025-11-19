import { createClient } from "@/lib/supabase/server";
import { SearchResults } from "./search-results";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SearchPage({
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
    const { data, error: fetchError } = await supabase
      .from("episodes")
      .select(
        `
        *,
        bands:band_id (
          id,
          name,
          cover_url,
          firstory_user_id
        )
      `,
      )
      .order("pub_date", { ascending: false });

    // Filter results to match query in episode title, description, creator, or band name
    // Also filter out episodes from bands with firstory_user_id starting with 'reco'
    const searchLower = query.toLowerCase();
    results = (data || []).filter((episode: any) => {
      // Skip if band has firstory_user_id starting with 'reco'
      if (episode.bands?.firstory_user_id?.startsWith("reco")) {
        return false;
      }

      // Check if query matches episode fields or band name
      const matchesEpisode =
        episode.title?.toLowerCase().includes(searchLower) ||
        episode.description?.toLowerCase().includes(searchLower) ||
        episode.creator?.toLowerCase().includes(searchLower);

      const matchesBand = episode.bands?.name
        ?.toLowerCase()
        .includes(searchLower);

      return matchesEpisode || matchesBand;
    });
    error = fetchError;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
      <Link
        href="/home"
        className="fixed top-6 left-6 flex items-center gap-2 text-purple-200/70 hover:text-white transition-colors group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Home</span>
      </Link>

      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Search Results
          </h1>

          {query && (
            <p className="text-white/60 mb-8">
              Showing results for:{" "}
              <span className="text-white font-semibold">{query}</span>
            </p>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
              <p className="text-red-400">
                Error loading search results. Please try again.
              </p>
            </div>
          )}

          {!query.trim() ? (
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-8 text-center">
              <p className="text-white/60">
                Enter a search query to find mixes
              </p>
            </div>
          ) : (
            <SearchResults results={results} query={query} />
          )}
        </div>
      </div>
    </div>
  );
}
