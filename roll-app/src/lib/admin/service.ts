import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _serviceClient: SupabaseClient | null = null;

/**
 * Returns a Supabase client using the service role key.
 * Bypasses RLS — use only in admin API routes after auth check.
 */
export function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_URL for admin service client');
  }

  _serviceClient = createClient(url, key);
  return _serviceClient;
}
