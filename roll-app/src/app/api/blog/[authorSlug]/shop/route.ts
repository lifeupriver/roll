import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

// GET /api/blog/[authorSlug]/shop — list public magazines + books for author
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ authorSlug: string }> }
) {
  try {
    const { authorSlug } = await params;
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

    // Fetch public magazines
    const { data: magazines } = await supabase
      .from('magazines')
      .select('id, title, cover_url, public_slug, is_public, created_at')
      .eq('user_id', profile.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(12);

    // Fetch public books
    const { data: books } = await supabase
      .from('books')
      .select('id, title, cover_url, public_slug, status, created_at')
      .eq('user_id', profile.id)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(12);

    return NextResponse.json({
      data: {
        magazines: (magazines || []).map((m: Record<string, unknown>) => ({
          id: m.id,
          title: m.title,
          cover_url: m.cover_url,
          public_slug: m.public_slug,
        })),
        books: (books || []).map((b: Record<string, unknown>) => ({
          id: b.id,
          title: b.title,
          cover_url: b.cover_url,
          public_slug: b.public_slug,
        })),
      },
    });
  } catch (err) {
    captureError(err, { context: 'blog-shop' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
