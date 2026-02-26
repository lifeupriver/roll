import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: memberId } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get member profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name, email, avatar_url')
      .eq('id', memberId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // Get photos shared by this member in circles the current user belongs to
    // First get circles the current user is in
    const { data: userCircles } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    const circleIds = (userCircles ?? []).map((c: Record<string, unknown>) => c.circle_id);

    let photos: Array<Record<string, unknown>> = [];

    if (circleIds.length > 0) {
      // Get posts by this member in shared circles
      const { data: posts } = await supabase
        .from('circle_posts')
        .select('id')
        .eq('user_id', memberId)
        .in('circle_id', circleIds);

      const postIds = (posts ?? []).map((p: Record<string, unknown>) => p.id);

      if (postIds.length > 0) {
        // Get photos from those posts
        const { data: postPhotos } = await supabase
          .from('circle_post_photos')
          .select(
            'photos(id, thumbnail_url, storage_key, date_taken, camera_make, camera_model, latitude, longitude)'
          )
          .in('post_id', postIds);

        photos = (postPhotos ?? [])
          .map((pp: Record<string, unknown>) => (pp as Record<string, unknown>).photos)
          .filter(Boolean) as Array<Record<string, unknown>>;
      }
    }

    return NextResponse.json({
      data: {
        profile,
        photos,
      },
    });
  } catch (err) {
    captureError(err, { context: 'member-profile' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
