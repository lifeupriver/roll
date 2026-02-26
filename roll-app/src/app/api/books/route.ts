import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { assembleBook, calculateBookPrice } from '@/lib/books/assemble';
import type { Book } from '@/types/book';

// GET /api/books — list user's books
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: books ?? [] });
  } catch (err) {
    captureError(err, { context: 'books-list' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/books — create book from selected magazines
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, magazineIds, format = '8x10', font = 'default', coverPhotoId, isPublic = false } = body;

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (!magazineIds || !Array.isArray(magazineIds) || magazineIds.length === 0) {
      return NextResponse.json({ error: 'At least one magazine is required' }, { status: 400 });
    }

    // Fetch user's magazines in order
    const { data: magazines, error: magError } = await supabase
      .from('magazines')
      .select('id, title, date_range_start, date_range_end, pages, page_count')
      .eq('user_id', user.id)
      .in('id', magazineIds);

    if (magError) {
      return NextResponse.json({ error: magError.message }, { status: 500 });
    }

    if (!magazines || magazines.length === 0) {
      return NextResponse.json({ error: 'No valid magazines found' }, { status: 400 });
    }

    // Sort magazines in the order they were selected
    const orderedMagazines = magazineIds
      .map((id: string) => magazines.find((m: Record<string, unknown>) => m.id === id))
      .filter(Boolean) as Array<Record<string, unknown>>;

    // Assemble book
    const assembled = assembleBook(
      title,
      coverPhotoId || null,
      orderedMagazines.map((m) => ({
        id: m.id as string,
        title: m.title as string,
        date_range_start: m.date_range_start as string | null,
        date_range_end: m.date_range_end as string | null,
        pages: (typeof m.pages === 'string' ? JSON.parse(m.pages as string) : m.pages) || [],
      }))
    );

    const priceCents = calculateBookPrice(format, assembled.totalPages);

    // Generate slug
    const slug = title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 60) + '-' + Date.now().toString(36);

    // Create book record
    const { data: book, error: createError } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title,
        slug,
        magazine_ids: magazineIds,
        cover_photo_id: coverPhotoId || null,
        font,
        format,
        page_count: assembled.totalPages,
        price_cents: priceCents,
        status: 'draft',
        is_public: isPublic,
        public_slug: isPublic ? slug : null,
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ data: book as Book }, { status: 201 });
  } catch (err) {
    captureError(err, { context: 'books-create' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
