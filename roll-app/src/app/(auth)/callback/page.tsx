import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function CallbackPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; error?: string }>;
}) {
  const params = await searchParams;

  if (params.error) {
    redirect('/login?error=auth_callback_error');
  }

  if (params.code) {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      redirect('/login?error=invalid_code');
    }

    // Check if user has photos to decide redirect
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { count } = await supabase
        .from('photos')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (count === 0) {
        redirect('/onboarding');
      }
    }

    redirect('/feed');
  }

  redirect('/login');
}
