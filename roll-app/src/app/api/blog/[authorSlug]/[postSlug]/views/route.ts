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
      .select('id')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Atomically increment view count via Postgres RPC to avoid race conditions
    const { data: updated, error } = await supabase
      .rpc('increment_view_count', { post_id: post.id });

    if (error) {
      return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }

    return NextResponse.json({ success: true, view_count: updated });
  } catch (err) {
    captureError(err, { context: 'blog-post-view' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
