'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores/userStore';
import { createClient } from '@/lib/supabase/client';
import type { UseUserReturn } from '@/types/hooks';

export function useUser(): UseUserReturn {
  const { user, loading, error, setUser, setLoading, setError } = useUserStore();

  useEffect(() => {
    const supabase = createClient();

    async function getUser() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              display_name: profile.display_name,
              avatar_url: profile.avatar_url,
              tier: profile.tier,
              onboarding_complete: profile.onboarding_complete,
              photo_count: profile.photo_count,
              storage_used_bytes: profile.storage_used_bytes,
              stripe_customer_id: profile.stripe_customer_id ?? null,
              stripe_subscription_id: profile.stripe_subscription_id ?? null,
              created_at: profile.created_at,
              updated_at: profile.updated_at,
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setLoading(false);
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setLoading, setError]);

  return { user, loading, error };
}
