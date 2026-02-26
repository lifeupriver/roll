import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { logAdminAction } from '@/lib/admin/audit';
import { captureError } from '@/lib/sentry';
import { isAdminPreviewMode, getMockUserDetailResponse } from '@/lib/admin/mock-data';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (isAdminPreviewMode()) {
      const { id } = await params;
      return NextResponse.json(getMockUserDetailResponse(id));
    }

    const { id } = await params;
    const db = getServiceClient();

    // Fetch user profile + related counts in parallel
    const [profileRes, rollsRes, ordersRes, favoritesRes, circlesRes, notesRes] = await Promise.all(
      [
        db.from('profiles').select('*').eq('id', id).single(),

        db
          .from('rolls')
          .select('id, name, status, film_profile, photo_count, created_at, updated_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false }),

        db
          .from('print_orders')
          .select('id, product, print_size, status, total_cents, created_at')
          .eq('user_id', id)
          .order('created_at', { ascending: false }),

        db.from('favorites').select('id', { count: 'exact', head: true }).eq('user_id', id),

        db
          .from('circle_members')
          .select('circle_id, circles(id, name, member_count)')
          .eq('user_id', id),

        db
          .from('admin_notes')
          .select('id, body, admin_id, created_at')
          .eq('target_type', 'user')
          .eq('target_id', id)
          .order('created_at', { ascending: false }),
      ]
    );

    if (profileRes.error || !profileRes.data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: profileRes.data,
      rolls: rollsRes.data ?? [],
      orders: ordersRes.data ?? [],
      favoritesCount: favoritesRes.count ?? 0,
      circles: circlesRes.data ?? [],
      notes: notesRes.data ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-user-detail' });
    return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (isAdminPreviewMode()) {
      const { id } = await params;
      return NextResponse.json({ profile: getMockUserDetailResponse(id).profile });
    }

    const { id } = await params;
    const body = await request.json();
    const db = getServiceClient();

    // Get current profile for audit log
    const { data: before } = await db.from('profiles').select('tier, role').eq('id', id).single();

    // Only allow specific field updates
    const updates: Record<string, unknown> = {};
    if (body.tier && (body.tier === 'free' || body.tier === 'plus')) {
      updates.tier = body.tier;
    }
    if (body.role && (body.role === 'user' || body.role === 'admin')) {
      updates.role = body.role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await db
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    const changedFields = Object.keys(updates);
    for (const field of changedFields) {
      await logAdminAction({
        adminId: admin.id,
        action: `user.${field}_change`,
        targetType: 'user',
        targetId: id,
        metadata: {
          before: before?.[field as keyof typeof before],
          after: updates[field],
        },
      });
    }

    return NextResponse.json({ profile: data });
  } catch (err) {
    captureError(err, { context: 'admin-user-update' });
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
