import { slugify } from "@/lib/utils/slug";
import { createStaticClient } from "@/lib/supabase/static";
import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://hybridized.online";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/about",
    "/audio-demo",
    "/contact",
    "/donation",
    "/home",
    "/privacy",
    "/support",
    "/terms",
    "/tests",
  ].map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" || route === "/home" ? 1 : 0.7,
  }));

  let artistRoutes: MetadataRoute.Sitemap = [];
  try {
    const supabase = createStaticClient();
    const { data: bands } = await supabase.from("bands").select("name").order("name");

    artistRoutes = (bands ?? [])
      .map((band) => band.name)
      .filter((name): name is string => Boolean(name))
      .map((name) => ({
        url: `${SITE_URL}/home/${encodeURIComponent(slugify(name))}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      }));
  } catch {
    // Database unavailable - sitemap falls back to static routes only
  }

  return [...staticRoutes, ...artistRoutes];
}
