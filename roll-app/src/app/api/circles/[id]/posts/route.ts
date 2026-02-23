import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, createCirclePostSchema } from '@/lib/validation';
import type { CirclePost } from '@/types/circle';

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

    // Verify user is a member of this circle
    const { data: membership, error: membershipError } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    // Fetch posts with joined photos, profiles, and reactions
    const { data: posts, error: postsError } = await supabase
      .from('circle_posts')
      .select('*, photos:circle_post_photos(*), profiles(display_name, email, avatar_url), reactions:circle_reactions(*), comments:circle_comments(*, profiles(display_name, email, avatar_url))')
      .eq('circle_id', id)
      .order('created_at', { ascending: false });

    if (postsError) {
      return NextResponse.json({ error: postsError.message }, { status: 500 });
    }

    return NextResponse.json({ data: (posts ?? []) as CirclePost[] });
  } catch (err) {
    captureError(err, { context: 'circle-posts' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of this circle
    const { data: membership, error: membershipError } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const parsed = await parseBody(request, createCirclePostSchema);
    if (parsed.error) return parsed.error;
    const { caption, photoStorageKeys } = parsed.data;

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('circle_posts')
      .insert({
        circle_id: id,
        user_id: user.id,
        caption: caption ?? null,
      })
      .select()
      .single();

    if (postError) {
      return NextResponse.json({ error: postError.message }, { status: 500 });
    }

    // Insert photos with sequential positions
    const photoInserts = photoStorageKeys.map((storageKey, index) => ({
      post_id: post.id,
      storage_key: storageKey,
      position: index,
    }));

    const { error: photosError } = await supabase
      .from('circle_post_photos')
      .insert(photoInserts);

    if (photosError) {
      return NextResponse.json({ error: photosError.message }, { status: 500 });
    }

    // Re-fetch the post with joined data
    const { data: fullPost, error: fetchError } = await supabase
      .from('circle_posts')
      .select('*, photos:circle_post_photos(*), profiles(display_name, email, avatar_url), reactions:circle_reactions(*), comments:circle_comments(*, profiles(display_name, email, avatar_url))')
      .eq('id', post.id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ data: fullPost as CirclePost }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'circle-posts' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
