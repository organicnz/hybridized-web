import { createClient } from "@/lib/supabase/server";
import { SearchResults } from "./search-results";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = searchParams.q || "";
  const supabase = await createClient();

  let results = [];
  let error = null;

  if (query.trim()) {
    const { data, error: fetchError } = await supabase
      .from("hybridized")
      .select("*")
      .or(
        `name.ilike.%${query}%,description.ilike.%${query}%,formula.ilike.%${query}%`,
      )
      .order("created_at", { ascending: false });

    results = data || [];
    error = fetchError;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900">
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
