'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { track, resetAnalytics } from '@/lib/analytics';
import { clearSentryUser } from '@/lib/sentry';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { logout: clearUser } = useUserStore();

  async function login(email: string, password: string) {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      track({ event: 'user_logged_in' });
      router.push('/photos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  async function loginWithMagicLink(email: string) {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/callback`,
        },
      });
      if (authError) throw authError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  }

  async function signup(email: string, password: string, displayName: string) {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (authError) throw authError;
      track({ event: 'user_signed_up' });
      router.push('/photos');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      setLoading(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      track({ event: 'user_logged_out' });
      resetAnalytics();
      clearSentryUser();
      clearUser();
      router.push('/login');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }

  return { login, loginWithMagicLink, signup, logout, loading, error };
}
