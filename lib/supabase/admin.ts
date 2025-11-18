import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database.types';

/**
 * Admin Supabase client for build-time operations
 * Does not use cookies, suitable for generateStaticParams
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
