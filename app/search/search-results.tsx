"use client";

import { Music, Play } from "lucide-react";
import Image from "next/image";
import { IframePlayer } from "@/components/iframe-player";

type Episode = {
  id: number;
  title: string;
  description?: string;
  audio_url: string;
  cover_url?: string;
  creator?: string;
  pub_date?: string;
  bands?: {
    id: number;
    name: string;
    cover_url?: string;
  };
};

export function SearchResults({
  results,
  query,
}: {
  results: Episode[];
  query: string;
}) {
  if (results.length === 0) {
    return (
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-8 text-center">
        <Music className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
        <p className="text-white/70 text-lg">No results found for "{query}"</p>
        <p className="text-white/50 text-sm mt-2">
          Try a different search term
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-white/70 mb-4">
        Found {results.length} {results.length === 1 ? "episode" : "episodes"}
      </p>

      <div className="grid gap-4">
        {results.map((episode) => {
          const coverUrl = episode.cover_url || episode.bands?.cover_url;
          const artistName =
            episode.bands?.name || episode.creator || "Unknown Artist";

          return (
            <div
              key={episode.id}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 hover:border-purple-400/20 transition-all group"
            >
              <div className="flex items-center gap-4 p-4">
                {coverUrl && (
                  <div className="flex-shrink-0">
                    <Image
                      src={coverUrl}
                      alt={episode.title}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate group-hover:text-purple-300 transition-colors">
                    {episode.title}
                  </h3>
                  <p className="text-sm text-purple-300/70 mb-2">
                    {artistName}
                  </p>
                  {episode.description && (
                    <p className="text-sm text-white/60 line-clamp-2">
                      {episode.description}
                    </p>
                  )}
                </div>

                <div className="flex-shrink-0">
                  <IframePlayer episode={episode as any} artist={artistName} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
