import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';
import { sendEmail } from '@/lib/email/resend';
import { subscriptionConfirmEmail } from '@/lib/email/templates';
import { randomBytes } from 'crypto';

// POST /api/blog/[authorSlug]/subscribe — subscribe by email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string }> }
) {
  try {
    const { authorSlug } = await params;
    const supabase = getServiceClient();

    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    // Find author
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, blog_slug, blog_enabled')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Check for existing subscription
    const { data: existing } = await supabase
      .from('email_subscribers')
      .select('id, confirmed')
      .eq('author_id', profile.id)
      .eq('email', email)
      .single();

    if (existing?.confirmed) {
      return NextResponse.json({ message: 'Already subscribed' });
    }

    // Generate confirmation token
    const token = randomBytes(32).toString('hex');

    if (existing) {
      // Update existing unconfirmed with new token
      await supabase
        .from('email_subscribers')
        .update({ confirm_token: token, created_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Create new subscriber
      const { error: insertError } = await supabase
        .from('email_subscribers')
        .insert({
          author_id: profile.id,
          email,
          confirmed: false,
          confirm_token: token,
        });

      if (insertError) {
        if (insertError.code === '23505') {
          return NextResponse.json({ message: 'Already subscribed' });
        }
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
      }
    }

    // Send confirmation email
    const html = subscriptionConfirmEmail(
      profile.display_name,
      profile.blog_slug,
      token
    );
    await sendEmail(email, `Confirm your subscription to ${profile.display_name}'s blog`, html);

    return NextResponse.json({ message: 'Check your email to confirm your subscription' });
  } catch (err) {
    captureError(err, { context: 'blog-subscribe' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/blog/[authorSlug]/subscribe?token=xxx — confirm subscription
// GET /api/blog/[authorSlug]/subscribe?unsubscribe=xxx — unsubscribe
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string }> }
) {
  try {
    const { authorSlug } = await params;
    const supabase = getServiceClient();
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const unsubscribeToken = url.searchParams.get('unsubscribe');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

    if (unsubscribeToken) {
      // Unsubscribe
      const { error } = await supabase
        .from('email_subscribers')
        .delete()
        .eq('confirm_token', unsubscribeToken);

      if (error) {
        return NextResponse.redirect(`${baseUrl}/blog/${authorSlug}?error=unsubscribe-failed`);
      }
      return NextResponse.redirect(`${baseUrl}/blog/${authorSlug}?unsubscribed=1`);
    }

    if (token) {
      // Confirm subscription
      const { data: subscriber, error } = await supabase
        .from('email_subscribers')
        .update({ confirmed: true })
        .eq('confirm_token', token)
        .select()
        .single();

      if (error || !subscriber) {
        return NextResponse.redirect(`${baseUrl}/blog/${authorSlug}?error=invalid-token`);
      }
      return NextResponse.redirect(`${baseUrl}/blog/${authorSlug}?subscribed=1`);
    }

    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  } catch (err) {
    captureError(err, { context: 'blog-subscribe-confirm' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
