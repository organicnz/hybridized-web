import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  try {
    // Authorization check using custom secret
    const authHeader = req.headers.get("Authorization");
    const functionSecret = Deno.env.get("FUNCTION_SECRET");

    if (functionSecret && authHeader !== `Bearer ${functionSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get total bands count
    const { count: totalBands } = await supabase
      .from("bands")
      .select("*", { count: "exact", head: true });

    // Get bands with formulas
    const { count: bandsWithFormulas } = await supabase
      .from("bands")
      .select("*", { count: "exact", head: true })
      .not("formula", "is", null);

    // Get bands with media
    const { count: bandsWithMedia } = await supabase
      .from("bands")
      .select("*", { count: "exact", head: true })
      .or("iframe_url.not.is.null,cover_url.not.is.null");

    // Get recent bands (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { count: recentBands } = await supabase
      .from("bands")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString());

    const stats = {
      totalBands: totalBands || 0,
      bandsWithFormulas: bandsWithFormulas || 0,
      bandsWithMedia: bandsWithMedia || 0,
      recentBands: recentBands || 0,
      completionRate: totalBands
        ? (((bandsWithFormulas || 0) / totalBands) * 100).toFixed(1)
        : 0,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(stats), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
