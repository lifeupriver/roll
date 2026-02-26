import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

const BOOK_FORMAT_SKU: Record<string, string> = {
  '8x10': 'GLOBAL-PHB-8x10-HRD-COV-MG',
  '10x10': 'GLOBAL-PHB-10x10-HRD-COV-MG',
};

// POST /api/books/[id]/order — submit book order
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    }

    if (book.status !== 'draft' && book.status !== 'review') {
      return NextResponse.json({ error: 'Book already ordered' }, { status: 400 });
    }

    const body = await request.json();
    const { shippingAddress, quantity = 1 } = body;

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    const sku = BOOK_FORMAT_SKU[book.format as string] || BOOK_FORMAT_SKU['8x10'];

    // Update book status to ordered
    const { error: updateError } = await supabase
      .from('books')
      .update({
        status: 'ordered',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // TODO: Submit to Prodigi API with assembled PDF
    // For now, return order confirmation
    return NextResponse.json({
      data: {
        orderId: id,
        sku,
        quantity,
        priceCents: book.price_cents,
        status: 'ordered',
      },
    });
  } catch (err) {
    captureError(err, { context: 'book-order' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
