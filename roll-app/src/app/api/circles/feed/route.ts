import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// GET /api/circles/feed — combined feed from all circles the user is in
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

    // Get circle IDs where user is a member
    const { data: memberships } = await supabase
      .from('circle_members')
      .select('circle_id')
      .eq('user_id', user.id);

    const circleIds = (memberships ?? []).map((m: { circle_id: string }) => m.circle_id);
    if (circleIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Fetch all posts from those circles
    const { data: posts, error: postsError } = await supabase
      .from('circle_posts')
      .select('*')
      .in('circle_id', circleIds)
      .order('created_at', { ascending: false });

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    const postIds = (posts ?? []).map((p: { id: string }) => p.id);
    const userIds = [...new Set((posts ?? []).map((p: { user_id: string }) => p.user_id))];

    // Fetch photos, reactions, comments for those posts
    const [photosResult, reactionsResult, commentsResult, profilesResult] = await Promise.all([
      postIds.length > 0
        ? supabase.from('circle_post_photos').select('*').in('post_id', postIds)
        : { data: [], error: null },
      postIds.length > 0
        ? supabase.from('circle_reactions').select('*').in('post_id', postIds)
        : { data: [], error: null },
      postIds.length > 0
        ? supabase.from('circle_comments').select('*').in('post_id', postIds)
        : { data: [], error: null },
      userIds.length > 0
        ? supabase.from('profiles').select('id, display_name, avatar_url').in('id', userIds)
        : { data: [], error: null },
    ]);

    const photosMap = new Map<string, typeof photosResult.data>();
    for (const photo of (photosResult.data ?? []) as Array<{ post_id: string }>) {
      const existing = photosMap.get(photo.post_id) ?? [];
      existing.push(photo);
      photosMap.set(photo.post_id, existing);
    }

    const reactionsMap = new Map<string, typeof reactionsResult.data>();
    for (const r of (reactionsResult.data ?? []) as Array<{ post_id: string }>) {
      const existing = reactionsMap.get(r.post_id) ?? [];
      existing.push(r);
      reactionsMap.set(r.post_id, existing);
    }

    const commentsMap = new Map<string, typeof commentsResult.data>();
    for (const c of (commentsResult.data ?? []) as Array<{ post_id: string }>) {
      const existing = commentsMap.get(c.post_id) ?? [];
      existing.push(c);
      commentsMap.set(c.post_id, existing);
    }

    const profilesMap = new Map<string, { display_name: string; avatar_url: string | null }>();
    for (const p of (profilesResult.data ?? []) as Array<{
      id: string;
      display_name: string;
      avatar_url: string | null;
    }>) {
      profilesMap.set(p.id, { display_name: p.display_name, avatar_url: p.avatar_url });
    }

    // Assemble full posts
    const enrichedPosts = (posts ?? []).map((post: { id: string; user_id: string }) => ({
      ...post,
      post_type: 'photos',
      photos: photosMap.get(post.id) ?? [],
      reactions: reactionsMap.get(post.id) ?? [],
      comments: commentsMap.get(post.id) ?? [],
      profiles: profilesMap.get(post.user_id) ?? { display_name: 'Unknown', avatar_url: null },
    }));

    return NextResponse.json({ data: enrichedPosts });
  } catch (err) {
    captureError(err, { context: 'circles-feed' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
