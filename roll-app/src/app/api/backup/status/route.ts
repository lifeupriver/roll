import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count all non-pending photos (backed up = uploaded and processed)
    const { count, error: countError } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .neq('filter_status', 'pending');

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Get total storage used from profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('storage_used_bytes')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Get most recent photo upload time
    const { data: lastPhoto, error: lastError } = await supabase
      .from('photos')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return NextResponse.json({
      data: {
        backed_up_count: count ?? 0,
        total_bytes: profile?.storage_used_bytes ?? 0,
        last_backup_at: lastError ? null : (lastPhoto?.created_at ?? null),
      },
    });
  } catch (err) {
    captureError(err, { context: 'backup-status' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
