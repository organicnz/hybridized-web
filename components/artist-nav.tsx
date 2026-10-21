"use client";

import { getSupabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { slugifyEncoded } from "@/lib/utils/slug";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ArtistNavProps {
  activeArtist?: string;
  className?: string;
}

export function ArtistNav({ activeArtist = "", className }: ArtistNavProps) {
  const _router = useRouter();
  const [artists, setArtists] = useState<string[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    async function fetchArtists() {
      const supabase = await getSupabase();
      const { data } = await supabase.from("bands").select("name").order("name");

      if (data) {
        setArtists(
          data
            .map((band: { name: string | null }) => band.name)
            .filter((name): name is string => Boolean(name)),
        );
      }
    }
    fetchArtists();
  }, []);

  // Scroll the active artist into view, within the nav.
  //
  // The nav is scrolled directly rather than with `scrollIntoView`, because
  // that scrolls *every* scrollable ancestor — including the page — which
  // yanks the layout. The measurements are taken from the boxes, so they do
  // not depend on the nav being a positioned element.
  useEffect(() => {
    const nav = navRef.current;
    const active = activeRef.current;
    if (!nav || !active || artists.length === 0) return;

    // Wait for the links to be laid out before measuring them.
    const timer = setTimeout(() => {
      const navBox = nav.getBoundingClientRect();
      const activeBox = active.getBoundingClientRect();
      const delta = activeBox.left - navBox.left - (nav.clientWidth - activeBox.width) / 2;

      nav.scrollTo({
        left: Math.max(0, nav.scrollLeft + delta),
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [artists.length]); // Only run when artists are loaded, not on every activeArtist change

  const getArtistSlug = (artist: string) => {
    return slugifyEncoded(artist);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, artist: string) => {
    if (activeArtist === artist) {
      e.preventDefault();
      return;
    }
  };

  return (
    <nav
      ref={navRef}
      className={cn(
        "surface-shell scrollbar-hide flex h-14 items-center gap-7 overflow-x-auto border-b px-6",
        className,
      )}
      aria-label="Artist navigation"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {artists.map((artist) => {
        const isActive = activeArtist === artist;

        return (
          <Link
            key={artist}
            ref={isActive ? activeRef : null}
            href={`/home/${getArtistSlug(artist)}`}
            onClick={(e) => handleClick(e, artist)}
            className={cn(
              "shrink-0 border-b-2 pb-4 font-display text-sm font-semibold whitespace-nowrap transition-all",
              isActive
                ? "cursor-default border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
            aria-current={isActive ? "page" : undefined}
            aria-disabled={isActive}
          >
            {artist}
          </Link>
        );
      })}
    </nav>
  );
}
