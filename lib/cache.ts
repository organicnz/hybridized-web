import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

/**
 * Cached function to fetch all bands
 * Revalidates every 5 minutes
 */
export const getCachedBands = unstable_cache(
  async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bands:', error);
      return [];
    }

    return data || [];
  },
  ['all-bands'],
  {
    revalidate: 300, // 5 minutes
    tags: ['bands'],
  }
);

/**
 * Cached function to fetch bands by artist name
 * Revalidates every 5 minutes
 */
export const getCachedArtistBands = unstable_cache(
  async (artistName: string) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('bands')
      .select('*')
      .ilike('name', artistName)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching artist bands:', error);
      return [];
    }

    return data || [];
  },
  ['artist-bands'],
  {
    revalidate: 300, // 5 minutes
    tags: ['bands'],
  }
);
