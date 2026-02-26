import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: reelId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify reel exists, belongs to user, and is developed
    const { data: reel, error: reelError } = await supabase
      .from('reels')
      .select('status')
      .eq('id', reelId)
      .eq('user_id', user.id)
      .single();

    if (reelError || !reel) {
      return NextResponse.json({ error: 'Reel not found' }, { status: 404 });
    }

    if (reel.status !== 'developed') {
      return NextResponse.json({ error: 'Only developed reels can be favorited' }, { status: 400 });
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorite_reels')
      .select('id')
      .eq('user_id', user.id)
      .eq('reel_id', reelId)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Already favorited' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('favorite_reels')
      .insert({ user_id: user.id, reel_id: reelId })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'reel-favorite' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reelId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
      .from('favorite_reels')
      .delete()
      .eq('user_id', user.id)
      .eq('reel_id', reelId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'reel-unfavorite' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
