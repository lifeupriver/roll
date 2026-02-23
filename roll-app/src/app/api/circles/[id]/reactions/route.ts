import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, circleReactionSchema } from '@/lib/validation';
import type { CircleReaction } from '@/types/circle';

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

    const parsed = await parseBody(request, circleReactionSchema);
    if (parsed.error) return parsed.error;
    const { postId, reactionType } = parsed.data;

    // Verify the post belongs to this circle
    const { data: post, error: postError } = await supabase
      .from('circle_posts')
      .select('id')
      .eq('id', postId)
      .eq('circle_id', id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found in this circle' }, { status: 404 });
    }

    // Insert reaction, handling duplicate gracefully
    const { data: reaction, error: reactionError } = await supabase
      .from('circle_reactions')
      .upsert(
        {
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        },
        { onConflict: 'post_id,user_id,reaction_type' }
      )
      .select()
      .single();

    if (reactionError) {
      return NextResponse.json({ error: reactionError.message }, { status: 500 });
    }

    return NextResponse.json({ data: reaction as CircleReaction }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'circle-reactions' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
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

    const parsed = await parseBody(request, circleReactionSchema);
    if (parsed.error) return parsed.error;
    const { postId, reactionType } = parsed.data;

    const { error: deleteError } = await supabase
      .from('circle_reactions')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .eq('reaction_type', reactionType);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'circle-reactions' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
