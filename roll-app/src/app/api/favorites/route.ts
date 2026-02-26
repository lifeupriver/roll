import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, addFavoriteSchema } from '@/lib/validation';
import type { Favorite } from '@/types/favorite';

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
      .from('favorites')
      .select(
        '*, photos(thumbnail_url, date_taken, camera_make, camera_model, width, height), rolls(name, film_profile)'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Favorite[] });
  } catch (err) {
    captureError(err, { context: 'favorites' });
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
      console.error('[Favorites POST] Auth failed:', authError?.message);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, addFavoriteSchema);
    if (parsed.error) return parsed.error;
    const { photoId, rollId } = parsed.data;

    // Verify photo exists and belongs to user
    const { data: photo, error: photoError } = await supabase
      .from('photos')
      .select('id')
      .eq('id', photoId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (photoError || !photo) {
      console.error('[Favorites POST] Photo not found:', photoId, photoError?.message);
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    // Verify roll exists and belongs to user
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (rollError || !roll) {
      console.error('[Favorites POST] Roll not found:', rollId, rollError?.message);
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    // Check if already favorited (use maybeSingle to avoid PGRST116 error on 0 rows)
    const { data: existing, error: existingError } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('photo_id', photoId)
      .maybeSingle();

    if (existingError) {
      console.error('[Favorites POST] Existing check failed:', existingError.message);
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (existing) {
      return NextResponse.json({ data: existing as Favorite }, { status: 201 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        photo_id: photoId,
        roll_id: rollId,
      })
      .select()
      .single();

    if (error) {
      console.error('[Favorites POST] Insert failed:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data as Favorite }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'favorites' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('[Favorites POST] Unexpected error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
