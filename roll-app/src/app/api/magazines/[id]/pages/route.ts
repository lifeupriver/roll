import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// PATCH /api/magazines/[id]/pages — reorder/edit pages
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    // Verify ownership
    const { data: magazine, error: lookupError } = await supabase
      .from('magazines')
      .select('id, pages')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (lookupError || !magazine) {
      return NextResponse.json({ error: 'Magazine not found' }, { status: 404 });
    }

    const body = await request.json();
    const { pages } = body;

    if (!Array.isArray(pages)) {
      return NextResponse.json({ error: 'pages must be an array' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('magazines')
      .update({
        pages: JSON.stringify(pages),
        page_count: pages.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    captureError(err, { context: 'magazine-pages-update' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
