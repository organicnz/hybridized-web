import { createStaticClient } from "@/lib/supabase/static";
import { slugify } from "@/lib/utils/slug";

/** An artist, as the database has it. */
export interface ArtistSummary {
  id: number;
  name: string;
}

/**
 * The artist whose slug is this one, if there is one.
 *
 * The slug is derived from the name, so it is not reversible: the bands are
 * read and the names are compared. There are a couple of dozen of them, so
 * the read is small.
 */
export async function findArtistBySlug(slug: string): Promise<ArtistSummary | null> {
  const supabase = createStaticClient();
  const { data: bands } = await supabase.from("bands").select("id, name");

  if (!bands) return null;

  const match = bands.find((band) => band.name && slugify(band.name) === slug);
  if (!match?.name) return null;

  return { id: match.id, name: match.name };
}
