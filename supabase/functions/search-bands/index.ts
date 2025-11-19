import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // This is a public search endpoint - no auth required
    // But you can optionally add rate limiting or other checks here

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return new Response(
        JSON.stringify({
          error: 'Query parameter "q" is required',
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Use full-text search with the GIN index we created
    const { data, error } = await supabase
      .rpc("search_bands", { search_query: query })
      .limit(limit);

    if (error) {
      // Fallback to ILIKE search if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("bands")
        .select("*")
        .or(
          `name.ilike.%${query}%,description.ilike.%${query}%,formula.ilike.%${query}%`,
        )
        .limit(limit);

      if (fallbackError) throw fallbackError;

      return new Response(
        JSON.stringify({
          results: fallbackData,
          count: fallbackData?.length || 0,
          query,
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        results: data,
        count: data?.length || 0,
        query,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
