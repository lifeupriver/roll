import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// POST /api/blog/[authorSlug]/[postSlug]/views — increment view count (debounced per session)
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;
    const supabase = getServiceClient();

    // Find author
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Find published post
    const { data: post } = await supabase
      .from('blog_posts')
      .select('id, view_count')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Increment view count
    const { error } = await supabase
      .from('blog_posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', post.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    captureError(err, { context: 'blog-post-view' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
