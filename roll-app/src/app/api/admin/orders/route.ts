import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';
import { isAdminPreviewMode, getMockOrdersResponse } from '@/lib/admin/mock-data';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (isAdminPreviewMode()) {
      const { searchParams } = new URL(request.url);
      return NextResponse.json(getMockOrdersResponse(searchParams.get('status') || undefined));
    }

    const db = getServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;
    const offset = (page - 1) * limit;

    // Aggregate stats
    const { data: allOrders } = await db
      .from('print_orders')
      .select('status, total_cents, is_free_first_roll');

    const statusBreakdown: Record<string, number> = {};
    let totalRevenueCents = 0;
    let freeFirstRollCount = 0;

    if (allOrders) {
      for (const o of allOrders) {
        statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
        if (o.total_cents) totalRevenueCents += o.total_cents;
        if (o.is_free_first_roll) freeFirstRollCount++;
      }
    }

    // Paginated order list
    let query = db
      .from('print_orders')
      .select(
        'id, user_id, product, print_size, photo_count, status, total_cents, is_free_first_roll, shipping_name, tracking_url, created_at, updated_at',
        { count: 'exact' }
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq('status', status);

    const { data: orders, count } = await query;

    return NextResponse.json({
      total: allOrders?.length ?? 0,
      statusBreakdown,
      totalRevenueCents,
      avgOrderValueCents: allOrders?.length ? Math.round(totalRevenueCents / allOrders.length) : 0,
      freeFirstRollCount,
      orders: orders ?? [],
      page,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    captureError(err, { context: 'admin-orders' });
    return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 });
  }
}
