import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import type { BlogPost } from '@/types/blog';

export async function POST(
  _request: NextRequest,
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

    // Fetch the post and verify ownership
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*, rolls(story)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.status === 'published') {
      return NextResponse.json({ data: post as BlogPost });
    }

    // Copy roll story to post if post has no story
    const rollStory = (post.rolls as Record<string, unknown> | null)?.story as string | null;
    const storyToUse = post.story || rollStory || null;

    // Publish
    const { data: published, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        story: storyToUse,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO (Sprint 4): Send notification emails to subscribers

    return NextResponse.json({ data: published as BlogPost });
  } catch (err) {
    captureError(err, { context: 'blog-post-publish' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
