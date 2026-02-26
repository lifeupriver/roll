import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const db = getServiceClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') || '';
    const tier = searchParams.get('tier') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? true : false;

    let query = db
      .from('profiles')
      .select(
        'id, email, display_name, tier, role, photo_count, storage_used_bytes, onboarding_complete, created_at, updated_at, stripe_customer_id, stripe_subscription_id, referral_code',
        { count: 'exact' }
      );

    // Search
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
    }

    // Filter by tier
    if (tier && (tier === 'free' || tier === 'plus')) {
      query = query.eq('tier', tier);
    }

    // Sort
    const validSortFields = ['created_at', 'photo_count', 'storage_used_bytes', 'email', 'tier'];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.order(sortField, { ascending: order });

    // Paginate
    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    });
  } catch (err) {
    captureError(err, { context: 'admin-users' });
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
  }
}
