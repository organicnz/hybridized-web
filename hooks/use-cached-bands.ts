"use client";

import { useState, useEffect } from 'react';
import type { Database } from '@/lib/types/database.types';
import { getCachedBands, cacheBands, clearExpiredCache } from '@/lib/music-cache';

type Band = Database['public']['Tables']['bands']['Row'];

interface UseCachedBandsResult {
  bands: Band[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and cache bands data
 * Uses IndexedDB for browser-side caching
 */
export function useCachedBands(initialBands: Band[] = []): UseCachedBandsResult {
  const [bands, setBands] = useState<Band[]>(initialBands);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchBands = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get from cache first
      const cachedData = await getCachedBands();
      
      if (cachedData) {
        setBands(cachedData);
        setIsLoading(false);
        return;
      }

      // If no cache, use initial data and cache it
      if (initialBands.length > 0) {
        await cacheBands(initialBands);
        setBands(initialBands);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch bands'));
      setBands(initialBands); // Fallback to initial data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Clear expired cache on mount
    clearExpiredCache().catch(console.error);
    
    // Fetch bands
    fetchBands();
  }, []);

  return {
    bands,
    isLoading,
    error,
    refetch: fetchBands,
  };
}
