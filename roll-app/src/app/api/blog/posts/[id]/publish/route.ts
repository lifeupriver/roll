import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';
import { sendEmail } from '@/lib/email/resend';
import { newPostNotificationEmail } from '@/lib/email/templates';
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

    // Publish atomically — only update if status is not already 'published'
    // so concurrent requests cannot both flip the status and send duplicate notifications
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
      .neq('status', 'published')
      .select()
      .maybeSingle();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // If no row was returned, another request already published it
    if (!published) {
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();
      return NextResponse.json({ data: existing as BlogPost });
    }

    // Send notification emails to confirmed subscribers (fire-and-forget)
    sendSubscriberNotifications(user.id, published as BlogPost).catch((err) =>
      captureError(err, { context: 'blog-post-publish-notify' })
    );

    return NextResponse.json({ data: published as BlogPost });
  } catch (err) {
    captureError(err, { context: 'blog-post-publish' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function sendSubscriberNotifications(authorId: string, post: BlogPost) {
  const supabase = getServiceClient();

  // Get author profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, blog_slug')
    .eq('id', authorId)
    .single();

  if (!profile?.blog_slug) return;

  // Get cover photo URL
  let coverPhotoUrl: string | null = null;
  if (post.cover_photo_id) {
    const { data: photo } = await supabase
      .from('photos')
      .select('developed_url, thumbnail_url')
      .eq('id', post.cover_photo_id)
      .single();
    coverPhotoUrl = (photo?.developed_url as string) || (photo?.thumbnail_url as string) || null;
  }

  // Get confirmed subscribers
  const { data: subscribers } = await supabase
    .from('email_subscribers')
    .select('email, confirm_token')
    .eq('author_id', authorId)
    .eq('confirmed', true);

  if (!subscribers || subscribers.length === 0) return;

  // Send emails (batch, max 100)
  for (const subscriber of subscribers) {
    const html = newPostNotificationEmail(
      profile.display_name as string,
      profile.blog_slug as string,
      post.title,
      post.slug,
      post.excerpt,
      coverPhotoUrl,
      subscriber.email as string,
      subscriber.confirm_token as string
    );

    await sendEmail(
      subscriber.email as string,
      `New post: ${post.title}`,
      html
    );
  }
}
