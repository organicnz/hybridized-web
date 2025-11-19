import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const bandId = searchParams.get("bandId");

  try {
    const supabase = await createClient();

    let query = supabase
      .from("episodes")
      .select("*")
      .order("pub_date", { ascending: false });

    // Filter by band if specified
    if (bandId) {
      query = query.eq("band_id", bandId);
    }

    const { data: episodes, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({ episodes: episodes || [] });
  } catch (error) {
    console.error("Error fetching episodes:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch episodes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
