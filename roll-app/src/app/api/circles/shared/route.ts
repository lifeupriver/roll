import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// GET /api/circles/shared — posts shared by the current user
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

    // Fetch posts by this user
    const { data: posts, error: postsError } = await supabase
      .from('circle_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    const postIds = (posts ?? []).map((p: { id: string }) => p.id);

    // Fetch photos for those posts
    const { data: photos } =
      postIds.length > 0
        ? await supabase.from('circle_post_photos').select('*').in('post_id', postIds)
        : { data: [] };

    const photosMap = new Map<string, typeof photos>();
    for (const photo of (photos ?? []) as Array<{ post_id: string }>) {
      const existing = photosMap.get(photo.post_id) ?? [];
      existing.push(photo);
      photosMap.set(photo.post_id, existing);
    }

    const enrichedPosts = (posts ?? []).map((post: { id: string }) => ({
      ...post,
      post_type: 'photos',
      photos: photosMap.get(post.id) ?? [],
      reactions: [],
      comments: [],
    }));

    return NextResponse.json({ data: enrichedPosts });
  } catch (err) {
    captureError(err, { context: 'circles-shared' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
