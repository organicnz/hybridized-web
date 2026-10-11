"use client";

import { IframePlayer } from "@/components/iframe-player";
import type { Database } from "@/lib/types/database.types";
import { Music } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion, StaggerContainer, StaggerItem } from "@/components/page-transition";

type EpisodeRow = Database["public"]["Tables"]["episodes"]["Row"] & {
  bands?: { id: number; name: string; cover_url?: string; firstory_user_id?: string } | null;
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
};

export function SearchResults({
  results,
  query,
}: {
  results: EpisodeRow[];
  query: string;
}) {
  if (results.length === 0) {
    return (
      <motion.div
        className="card-flat p-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Music className="w-16 h-16 text-primary/30 mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">No results found for "{query}"</p>
        <p className="text-sm text-muted-foreground/70 mt-2">Try a different search term</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.p
        className="text-muted-foreground mb-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        Found {results.length} {results.length === 1 ? "episode" : "episodes"}
      </motion.p>

      <StaggerContainer stagger={0.05} delayChildren={0.1}>
        <div className="grid gap-4">
          {results.map((episode, index) => {
            const coverUrl = episode.cover_url || episode.bands?.cover_url;
            const artistName = episode.bands?.name || episode.creator || "Unknown Artist";

            return (
              <StaggerItem key={episode.id} custom={index}>
                <motion.div
                  className={cn("card-raised overflow-hidden group")}
                  variants={itemVariants}
                  whileHover={{ y: -4, boxShadow: "0 20px 40px -12px hsl(0 0% 0% / 0.5)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <div className="flex items-center gap-4 p-4">
                    {coverUrl && (
                      <div className="flex-shrink-0">
                        <Image
                          src={coverUrl}
                          alt={episode.title}
                          width={80}
                          height={80}
                          className="rounded-lg object-cover group-hover:scale-105 transition-transform duration-fast"
                        />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                        {episode.title}
                      </h3>
                      <p className="text-sm text-primary/70 mb-2">{artistName}</p>
                      {episode.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {episode.description}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <IframePlayer episode={episode} artist={artistName} />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </div>
      </StaggerContainer>
    </div>
  );
}
