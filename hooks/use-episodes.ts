import { useState, useCallback } from "react";

interface Episode {
  id: number;
  episode_id: string;
  title: string;
  audio_url: string;
  cover_url: string | null;
  description: string | null;
  pub_date: string;
  band_id: number | null;
}

interface EpisodesResponse {
  episodes: Episode[];
  error?: string;
}

interface UseEpisodesReturn {
  episodes: Episode[] | null;
  isLoading: boolean;
  error: string | null;
  fetchEpisodes: (bandId?: number) => Promise<Episode[]>;
}

export function useEpisodes(): UseEpisodesReturn {
  const [episodes, setEpisodes] = useState<Episode[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEpisodes = useCallback(
    async (bandId?: number): Promise<Episode[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const url = bandId ? `/api/episodes?bandId=${bandId}` : "/api/episodes";
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to load episodes");
        }

        const data: EpisodesResponse = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.episodes || data.episodes.length === 0) {
          throw new Error("No episodes found");
        }

        setEpisodes(data.episodes);
        return data.episodes;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load episodes";
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { episodes, isLoading, error, fetchEpisodes };
}
