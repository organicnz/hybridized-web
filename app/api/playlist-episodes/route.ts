import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const playlistId = searchParams.get("playlistId");

  if (!playlistId) {
    return NextResponse.json(
      { error: "playlistId is required" },
      { status: 400 },
    );
  }

  try {
    // Fetch the playlist page to get episode IDs
    const playlistUrl = `https://open.firstory.me/embed/playlists/${playlistId}`;
    const response = await fetch(playlistUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HybridizedApp/1.0)",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist: ${response.status}`);
    }

    const html = await response.text();

    // Extract episode IDs from the HTML
    const episodeIds = extractEpisodeIds(html);

    return NextResponse.json({ episodeIds });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    const message =
      error instanceof Error ? error.message : "Failed to fetch playlist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function extractEpisodeIds(html: string): string[] {
  const episodeIds: string[] = [];

  // Look for episode IDs in the HTML (they appear in story URLs)
  const storyRegex = /story\/(cl[a-z0-9]+)/g;
  let match;

  while ((match = storyRegex.exec(html)) !== null) {
    const episodeId = match[1];
    if (!episodeIds.includes(episodeId)) {
      episodeIds.push(episodeId);
    }
  }

  return episodeIds;
}
