import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();

    const [plusRes, ordersRes, freeRollsRes] = await Promise.all([
      db.from('profiles').select('id, stripe_subscription_id, created_at').eq('tier', 'plus'),

      db
        .from('print_orders')
        .select('id, total_cents, is_free_first_roll, status, created_at')
        .not('status', 'eq', 'cancelled'),

      db.from('print_orders').select('total_cents').eq('is_free_first_roll', true),
    ]);

    const plusSubscribers = plusRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const freeRolls = freeRollsRes.data ?? [];

    // Revenue from orders
    const orderRevenueCents = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0);

    // Free first roll cost (estimate: we absorb production cost)
    // Assuming avg cost of ~$12-15 per free roll of prints
    const estimatedFreeRollCostCents = freeRolls.length * 1200;

    // Monthly revenue estimate (Plus at $4.99/month)
    const estimatedMRRCents = plusSubscribers.length * 499;

    // Revenue by month
    const revenueByMonth: Record<string, number> = {};
    for (const o of orders) {
      const month = new Date(o.created_at).toISOString().slice(0, 7);
      revenueByMonth[month] = (revenueByMonth[month] || 0) + (o.total_cents || 0);
    }

    return NextResponse.json({
      plusSubscribers: plusSubscribers.length,
      estimatedMRRCents,
      totalOrderRevenueCents: orderRevenueCents,
      totalOrders: orders.length,
      avgOrderValueCents: orders.length > 0 ? Math.round(orderRevenueCents / orders.length) : 0,
      freeFirstRollCount: freeRolls.length,
      estimatedFreeRollCostCents,
      revenueByMonth: Object.entries(revenueByMonth).sort(([a], [b]) => a.localeCompare(b)),
    });
  } catch (err) {
    captureError(err, { context: 'admin-revenue' });
    return NextResponse.json({ error: 'Failed to load revenue data' }, { status: 500 });
  }
}
