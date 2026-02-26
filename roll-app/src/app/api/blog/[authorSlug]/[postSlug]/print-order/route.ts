import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// POST /api/blog/[authorSlug]/[postSlug]/print-order — order prints from a blog post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; postSlug: string }> }
) {
  try {
    const { authorSlug, postSlug } = await params;

    // Auth required
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to order prints' }, { status: 401 });
    }

    const serviceSupabase = getServiceClient();

    // Find post
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    const { data: post } = await serviceSupabase
      .from('blog_posts')
      .select('id, roll_id, allow_print_orders')
      .eq('user_id', profile.id)
      .eq('slug', postSlug)
      .eq('status', 'published')
      .single();

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!post.allow_print_orders) {
      return NextResponse.json({ error: 'Print ordering is not enabled for this post' }, { status: 403 });
    }

    const body = await request.json();
    const { photoIds, shippingAddress, quantity = 1 } = body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Select at least one photo' }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // Create print order
    const { data: order, error: orderError } = await serviceSupabase
      .from('print_orders')
      .insert({
        user_id: user.id,
        photo_ids: photoIds,
        quantity,
        source: 'blog',
        blog_post_id: post.id,
        shipping_name: shippingAddress.name,
        shipping_line1: shippingAddress.line1,
        shipping_line2: shippingAddress.line2 || null,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_postal_code: shippingAddress.postalCode,
        shipping_country: shippingAddress.country || 'US',
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    return NextResponse.json({ data: order }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'blog-print-order' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
