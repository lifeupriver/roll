import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// POST /api/blog/[authorSlug]/book-order/[slug] — order a book
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string; slug: string }> }
) {
  try {
    const { authorSlug, slug } = await params;

    // Auth required
    const authSupabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await authSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sign in to order' }, { status: 401 });
    }

    const serviceSupabase = getServiceClient();

    // Find author
    const { data: profile } = await serviceSupabase
      .from('profiles')
      .select('id')
      .eq('blog_slug', authorSlug)
      .eq('blog_enabled', true)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Blog not found' }, { status: 404 });
    }

    // Find public book
    const { data: book } = await serviceSupabase
      .from('books')
      .select('id, title, price_cents, format')
      .eq('user_id', profile.id)
      .eq('public_slug', slug)
      .eq('status', 'published')
      .single();

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    const body = await request.json();
    const { shippingAddress, quantity = 1 } = body;

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    // TODO: Create Stripe Checkout session and Prodigi order
    return NextResponse.json({
      data: {
        bookId: book.id,
        title: book.title,
        priceCents: book.price_cents,
        quantity,
        status: 'pending',
      },
    }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'blog-book-order' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
