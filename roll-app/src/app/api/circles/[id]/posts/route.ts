import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { createCirclePostSchema, createCircleReelPostSchema } from '@/lib/validation';
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

    // Determine post type from request body
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const isReelPost = raw && typeof raw === 'object' && 'reelId' in raw;

    if (isReelPost) {
      // ---- Reel post flow ----
      const result = createCircleReelPostSchema.safeParse(raw);
      if (!result.success) {
        const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        return NextResponse.json({ error: 'Validation error', details: issues }, { status: 400 });
      }
      const { caption, reelId } = result.data;

      // Verify the reel belongs to the user and is developed
      const { data: reel, error: reelError } = await supabase
        .from('reels')
        .select('id, assembled_storage_key, poster_storage_key, assembled_duration_ms')
        .eq('id', reelId)
        .eq('user_id', user.id)
        .eq('status', 'developed')
        .single();

      if (reelError || !reel) {
        return NextResponse.json({ error: 'Reel not found or not developed' }, { status: 404 });
      }

      const { data: post, error: postError } = await supabase
        .from('circle_posts')
        .insert({
          circle_id: id,
          user_id: user.id,
          caption: caption ?? null,
          post_type: 'reel',
          reel_storage_key: reel.assembled_storage_key,
          reel_poster_key: reel.poster_storage_key,
          reel_duration_ms: reel.assembled_duration_ms,
        })
        .select()
        .single();

      if (postError) {
        return NextResponse.json({ error: postError.message }, { status: 500 });
      }

      // Re-fetch with joined data
      const { data: fullPost, error: fetchError } = await supabase
        .from('circle_posts')
        .select('*, photos:circle_post_photos(*), profiles(display_name, email, avatar_url), reactions:circle_reactions(*), comments:circle_comments(*, profiles(display_name, email, avatar_url))')
        .eq('id', post.id)
        .single();

      if (fetchError) {
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      return NextResponse.json({ data: fullPost as CirclePost }, { status: 201 });
    }

    // ---- Photo post flow (original) ----
    const parsed = createCirclePostSchema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return NextResponse.json({ error: 'Validation error', details: issues }, { status: 400 });
    }
    const { caption, photoStorageKeys } = parsed.data;

    // Create the post
    const { data: post, error: postError } = await supabase
      .from('circle_posts')
      .insert({
        circle_id: id,
        user_id: user.id,
        caption: caption ?? null,
        post_type: 'photos',
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

    // Send push notifications to other circle members (Phase 3.8)
    try {
      const { data: members } = await supabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', id)
        .neq('user_id', user.id);

      const { data: circle } = await supabase
        .from('circles')
        .select('name')
        .eq('id', id)
        .single();

      const { data: poster } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      if (members && members.length > 0 && circle) {
        const memberIds = members.map((m: { user_id: string }) => m.user_id);
        const { data: subscriptions } = await supabase
          .from('push_subscriptions')
          .select('*')
          .in('user_id', memberIds);

        const photoCount = photoInserts?.length ?? 0;
        const notifBody = `${poster?.display_name || 'Someone'} shared ${isReelPost ? 'a reel' : `${photoCount} new photo${photoCount !== 1 ? 's' : ''}`} to ${circle.name}`;

        for (const sub of subscriptions ?? []) {
          try {
            const subData = typeof sub.subscription_data === 'string'
              ? JSON.parse(sub.subscription_data)
              : sub.subscription_data;
            // Web Push API — fire and forget
            await fetch(subData.endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ title: circle.name, body: notifBody, url: `/circles/${id}` }),
            }).catch(() => {});
          } catch {
            // Push delivery failure is non-critical
          }
        }
      }
    } catch {
      // Push notification failure is non-critical
    }

    return NextResponse.json({ data: fullPost as CirclePost }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'circle-posts' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
