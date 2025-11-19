"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface ArtistNavProps {
  activeArtist?: string;
  className?: string;
}

export function ArtistNav({
  activeArtist = "Hybrid",
  className,
}: ArtistNavProps) {
  const router = useRouter();
  const [artists, setArtists] = useState<string[]>([]);
  const supabase = createClient();
  const navRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    async function fetchArtists() {
      const { data } = await supabase
        .from("bands")
        .select("name")
        .order("name");

      if (data) {
        setArtists(data.map((band) => band.name).filter(Boolean));
      }
    }
    fetchArtists();
  }, [supabase]);

  // Scroll active artist into view (only when artists list changes or on mount)
  useEffect(() => {
    if (activeRef.current && navRef.current && artists.length > 0) {
      // Use setTimeout to avoid layout thrashing
      setTimeout(() => {
        activeRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }, 100);
    }
  }, [artists.length]); // Only run when artists are loaded, not on every activeArtist change

  const getArtistSlug = (artist: string) => {
    return encodeURIComponent(artist.toLowerCase().replace(/\s+/g, "-"));
  };

  const handleClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    artist: string,
  ) => {
    if (activeArtist === artist) {
      e.preventDefault();
      return;
    }
  };

  return (
    <nav
      ref={navRef}
      className={cn(
        "bg-zinc-900/50 backdrop-blur-sm border-b border-white/5 h-14 px-6 flex items-center gap-8 overflow-x-auto scrollbar-hide",
        className,
      )}
      role="navigation"
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
              "whitespace-nowrap text-sm font-semibold pb-4 border-b-2 transition-all flex-shrink-0",
              isActive
                ? "text-white border-[#1DB954] cursor-default"
                : "text-white/60 border-transparent hover:text-white hover:border-white/20 cursor-pointer",
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
