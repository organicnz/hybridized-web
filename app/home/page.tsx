import { createStaticClient } from "@/lib/supabase/static";
import { slugifyEncoded } from "@/lib/utils/slug";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";

async function ArtistRedirect() {
  const supabase = createStaticClient();
  const { data: bands } = await supabase.from("bands").select("name").order("name").limit(1);

  const firstArtist = bands?.[0]?.name;
  if (!firstArtist) {
    notFound();
  }

  // Redirect to the first artist alphabetically — no hardcoded default band
  redirect(`/home/${slugifyEncoded(firstArtist)}`);
  return null;
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ArtistRedirect />
    </Suspense>
  );
}
