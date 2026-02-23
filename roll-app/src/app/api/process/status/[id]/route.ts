import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('status, photos_processed, photo_count, processing_error')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        status: roll.status,
        photos_processed: roll.photos_processed,
        photo_count: roll.photo_count,
        processing_error: roll.processing_error,
      },
    });
  } catch (err) {
    captureError(err, { context: 'process-status' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
