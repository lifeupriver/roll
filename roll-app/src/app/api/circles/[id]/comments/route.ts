import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { parseBody, circleCommentSchema, deleteCommentSchema } from '@/lib/validation';
import type { CircleComment } from '@/types/circle';

// POST — add a comment to a circle post
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is a member of this circle
    const { data: membership } = await supabase
      .from('circle_members')
      .select('id')
      .eq('circle_id', id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      return NextResponse.json({ error: 'Circle not found' }, { status: 404 });
    }

    const parsed = await parseBody(request, circleCommentSchema);
    if (parsed.error) return parsed.error;
    const { postId, text } = parsed.data;

    // Verify post belongs to this circle
    const { data: post } = await supabase
      .from('circle_posts')
      .select('id')
      .eq('id', postId)
      .eq('circle_id', id)
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const { data: comment, error: insertError } = await supabase
      .from('circle_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        body: text.trim(),
      })
      .select('*, profiles(display_name, email, avatar_url)')
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ data: comment as CircleComment }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'circle-comments' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE — remove a comment (author or circle creator only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, deleteCommentSchema);
    if (parsed.error) return parsed.error;
    const { commentId } = parsed.data;

    // Get the comment
    const { data: comment } = await supabase
      .from('circle_comments')
      .select('*, circle_posts!inner(circle_id)')
      .eq('id', commentId)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check authorization: comment author or circle creator
    const isAuthor = comment.user_id === user.id;
    if (!isAuthor) {
      const { data: membership } = await supabase
        .from('circle_members')
        .select('role')
        .eq('circle_id', id)
        .eq('user_id', user.id)
        .single();

      if (!membership || membership.role !== 'creator') {
        return NextResponse.json(
          { error: 'Not authorized to delete this comment' },
          { status: 403 }
        );
      }
    }

    const { error: deleteError } = await supabase
      .from('circle_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'circle-comments' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
