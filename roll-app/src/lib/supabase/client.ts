import { createBrowserClient } from '@supabase/ssr';
import { isPreviewMode, createMockSupabaseClient } from './mock';

export function createClient() {
  if (isPreviewMode()) {
    return createMockSupabaseClient() as ReturnType<typeof createBrowserClient>;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
