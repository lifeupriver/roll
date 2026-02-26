import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// GET /api/blog/[authorSlug]/[postSlug]/comments — list comments (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;
    const supabase = getServiceClient();

    // Find post
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: post } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Pagination
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data: comments, count } = await supabase
      .from('blog_comments')
      .select(`
        id, body, created_at, user_id,
        profiles:user_id(display_name, avatar_url)
      `, { count: 'exact' })
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    return NextResponse.json({
      data: {
        comments: (comments || []).map((c: Record<string, unknown>) => {
          const author = c.profiles as Record<string, unknown> | null;
          return {
            id: c.id,
            body: c.body,
            created_at: c.created_at,
            user_id: c.user_id,
            author_name: author?.display_name || 'Anonymous',
            author_avatar: author?.avatar_url || null,
          };
        }),
        total: count || 0,
        page,
        has_more: offset + limit < (count || 0),
      },
    });
  } catch (err) {
    captureError(err, { context: 'blog-comments-list' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/blog/[authorSlug]/[postSlug]/comments — add comment (auth required)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;

    // Auth check
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });
    }

    const body = await request.json();
    const commentBody = (body.body || '').trim();

    if (!commentBody || commentBody.length > 2000) {
      return NextResponse.json({ error: 'Comment must be 1-2000 characters' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Find post
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: post } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Insert comment
    const { data: comment, error: insertError } = await supabase
      .from('blog_comments')
      .insert({
        post_id: post.id,
        user_id: user.id,
        body: commentBody,
      })
      .select(`
        id, body, created_at, user_id,
        profiles:user_id(display_name, avatar_url)
      `)
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const author = (comment as Record<string, unknown>).profiles as Record<string, unknown> | null;

    return NextResponse.json({
      data: {
        id: comment.id,
        body: comment.body,
        created_at: comment.created_at,
        user_id: comment.user_id,
        author_name: author?.display_name || 'Anonymous',
        author_avatar: author?.avatar_url || null,
      },
    }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'blog-comment-add' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[authorSlug]/[postSlug]/comments?id=xxx — delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;

    // Auth check
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const commentId = url.searchParams.get('id');
    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    const supabase = getServiceClient();

    // Find post and verify ownership context
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const { data: post } = await supabase
      .from('blog_posts')
      .select('id, user_id')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Fetch comment
    const { data: comment } = await supabase
      .from('blog_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('post_id', post.id)
      .single();

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Only comment author or post owner can delete
    const isCommentAuthor = comment.user_id === user.id;
    const isPostOwner = post.user_id === user.id;

    if (!isCommentAuthor && !isPostOwner) {
      return NextResponse.json({ error: 'Not authorized to delete this comment' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('blog_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'blog-comment-delete' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
