import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, createReelSchema } from '@/lib/validation';
import {
  REEL_SHORT_DURATION_MS,
  REEL_STANDARD_DURATION_MS,
  REEL_FEATURE_DURATION_MS,
} from '@/lib/utils/constants';
import type { Reel } from '@/types/reel';

const SIZE_TO_DURATION: Record<string, number> = {
  short: REEL_SHORT_DURATION_MS,
  standard: REEL_STANDARD_DURATION_MS,
  feature: REEL_FEATURE_DURATION_MS,
};

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

    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Reel[] });
  } catch (err) {
    captureError(err, { context: 'reels-list' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, createReelSchema);
    if (parsed.error) return parsed.error;
    const { name, reelSize } = parsed.data;

    // Check tier for non-short reels
    if (reelSize !== 'short') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .single();

      if (profile?.tier !== 'plus') {
        return NextResponse.json(
          { error: 'Roll+ required for standard and feature reels' },
          { status: 403 }
        );
      }
    }

    // Auto-generate name from current date if not provided
    let reelName = name;
    if (!reelName) {
      const now = new Date();
      const month = now.toLocaleString('en-US', { month: 'long' });
      const day = now.getDate();
      reelName = `Reel \u2014 ${month} ${day}`;
    }

    const targetDuration = SIZE_TO_DURATION[reelSize] ?? REEL_SHORT_DURATION_MS;

    const { data, error } = await supabase
      .from('reels')
      .insert({
        user_id: user.id,
        name: reelName,
        status: 'building',
        reel_size: reelSize,
        target_duration_ms: targetDuration,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Reel }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'reels-create' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
