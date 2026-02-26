import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const db = getServiceClient();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Run all queries in parallel
    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      plusUsers,
      totalPhotos,
      photosToday,
      rollsByStatus,
      totalOrders,
      pendingOrders,
      pendingJobs,
      recentSignups,
      recentActivity,
      unackedInsights,
    ] = await Promise.all([
      // Total users
      db.from('profiles').select('id', { count: 'exact', head: true }),

      // New users today
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart),

      // New users this week
      db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo),

      // Plus subscribers
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'plus'),

      // Total photos
      db.from('photos').select('id', { count: 'exact', head: true }),

      // Photos uploaded today
      db.from('photos').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),

      // Rolls by status
      db.from('rolls').select('status'),

      // Total orders
      db.from('print_orders').select('id', { count: 'exact', head: true }),

      // Pending orders
      db
        .from('print_orders')
        .select('id', { count: 'exact', head: true })
        .in('status', ['pending', 'submitted', 'in_production']),

      // Pending processing jobs
      db
        .from('processing_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Recent signups (last 10)
      db
        .from('profiles')
        .select('id, email, display_name, tier, created_at')
        .order('created_at', { ascending: false })
        .limit(10),

      // Recent rolls developed (last 10)
      db
        .from('rolls')
        .select('id, name, status, film_profile, user_id, updated_at')
        .order('updated_at', { ascending: false })
        .limit(10),

      // Unacknowledged AI insights
      db
        .from('admin_insights')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    // Compute roll status breakdown
    const rollStatusBreakdown: Record<string, number> = {};
    if (rollsByStatus.data) {
      for (const r of rollsByStatus.data) {
        rollStatusBreakdown[r.status] = (rollStatusBreakdown[r.status] || 0) + 1;
      }
    }

    // Compute storage from profiles
    const { data: storageData } = await db.from('profiles').select('storage_used_bytes');
    const totalStorageBytes = storageData
      ? storageData.reduce(
          (sum: number, p: { storage_used_bytes: number }) => sum + (p.storage_used_bytes || 0),
          0
        )
      : 0;

    return NextResponse.json({
      stats: {
        users: {
          total: totalUsers.count ?? 0,
          newToday: newUsersToday.count ?? 0,
          newThisWeek: newUsersWeek.count ?? 0,
          plusSubscribers: plusUsers.count ?? 0,
        },
        photos: {
          total: totalPhotos.count ?? 0,
          uploadedToday: photosToday.count ?? 0,
        },
        rolls: {
          statusBreakdown: rollStatusBreakdown,
          total: rollsByStatus.data?.length ?? 0,
        },
        orders: {
          total: totalOrders.count ?? 0,
          pending: pendingOrders.count ?? 0,
        },
        pipeline: {
          pendingJobs: pendingJobs.count ?? 0,
        },
        storage: {
          totalBytes: totalStorageBytes,
        },
      },
      recentSignups: recentSignups.data ?? [],
      recentActivity: recentActivity.data ?? [],
      insights: unackedInsights.data ?? [],
    });
  } catch (err) {
    captureError(err, { context: 'admin-stats' });
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
