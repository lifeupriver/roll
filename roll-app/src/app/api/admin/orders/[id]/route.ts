import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { logAdminAction } from '@/lib/admin/audit';
import { captureError } from '@/lib/sentry';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { id } = await params;
    const db = getServiceClient();

    const [orderRes, itemsRes] = await Promise.all([
      db.from('print_orders').select('*').eq('id', id).single(),
      db.from('print_order_items').select('*').eq('order_id', id).order('position'),
    ]);

    if (orderRes.error || !orderRes.data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      order: orderRes.data,
      items: itemsRes.data ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-order-detail' });
    return NextResponse.json({ error: 'Failed to load order' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { id } = await params;
    const body = await request.json();
    const db = getServiceClient();

    const { data: before } = await db.from('print_orders').select('status').eq('id', id).single();

    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.tracking_url) updates.tracking_url = body.tracking_url;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 });
    }

    const { data, error } = await db
      .from('print_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await logAdminAction({
      adminId: admin.id,
      action: 'order.update',
      targetType: 'order',
      targetId: id,
      metadata: { before: before?.status, after: updates },
    });

    return NextResponse.json({ order: data });
  } catch (err) {
    captureError(err, { context: 'admin-order-update' });
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
