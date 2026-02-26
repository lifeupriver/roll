import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch 36 oldest unassigned favorites
    const { data: favorites, error: favError } = await supabase
      .from('favorites')
      .select('id, photo_id')
      .eq('user_id', user.id)
      .is('roll_id', null)
      .order('created_at', { ascending: true })
      .limit(36);

    if (favError) {
      return NextResponse.json({ error: favError.message }, { status: 500 });
    }

    if (!favorites || favorites.length < 36) {
      return NextResponse.json(
        { error: 'Not enough unassigned favorites. Need at least 36.' },
        { status: 400 }
      );
    }

    // 2. Create new roll
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .insert({
        user_id: user.id,
        status: 'building',
        max_photos: 36,
        photo_count: 36,
      })
      .select()
      .single();

    if (rollError || !roll) {
      return NextResponse.json(
        { error: rollError?.message ?? 'Failed to create roll' },
        { status: 500 }
      );
    }

    // 3. Create roll_photos entries with position = favorite order
    const rollPhotos = favorites.map((fav, index) => ({
      roll_id: roll.id,
      photo_id: fav.photo_id,
      position: index + 1,
    }));

    const { error: photosError } = await supabase
      .from('roll_photos')
      .insert(rollPhotos);

    if (photosError) {
      // Clean up the roll if photos insertion fails
      await supabase.from('rolls').delete().eq('id', roll.id);
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    // 4. Update favorites to reference the new roll
    const favoriteIds = favorites.map((f) => f.id);
    const { error: updateError } = await supabase
      .from('favorites')
      .update({ roll_id: roll.id })
      .in('id', favoriteIds);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { rollId: roll.id } as { rollId: string } }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'rolls-from-favorites' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
