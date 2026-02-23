import { getServiceClient } from '../service';

export interface SystemSnapshot {
  period: { start: string; end: string };
  users: {
    total: number;
    newThisPeriod: number;
    plusCount: number;
    onboardingCompletionRate: number;
    activeLast7d: number;
  };
  photos: {
    total: number;
    uploadedThisPeriod: number;
    filterBreakdown: Record<string, number>;
    avgAestheticScore: number;
  };
  rolls: {
    total: number;
    developedThisPeriod: number;
    statusBreakdown: Record<string, number>;
    filmProfilePopularity: Record<string, number>;
    errorRate: number;
  };
  orders: {
    total: number;
    newThisPeriod: number;
    statusBreakdown: Record<string, number>;
    totalRevenueCents: number;
    avgOrderValueCents: number;
    freeFirstRollCount: number;
  };
  circles: {
    total: number;
    totalPosts: number;
    avgMembers: number;
  };
  pipeline: {
    pendingJobs: number;
    failedJobs: number;
  };
  referrals: {
    totalSent: number;
    signedUp: number;
    converted: number;
  };
}

export async function buildSystemSnapshot(periodDays: number = 1): Promise<SystemSnapshot> {
  const db = getServiceClient();
  const now = new Date();
  const periodStart = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsersRes,
    newUsersRes,
    plusUsersRes,
    onboardedRes,
    totalPhotosRes,
    newPhotosRes,
    filterStatusRes,
    aestheticRes,
    rollsRes,
    newDevelopedRes,
    ordersRes,
    newOrdersRes,
    circlesRes,
    postsRes,
    pendingJobsRes,
    failedJobsRes,
    referralsRes,
    activeUsersRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', periodStart.toISOString()),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'plus'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('onboarding_complete', true),
    db.from('photos').select('id', { count: 'exact', head: true }),
    db.from('photos').select('id', { count: 'exact', head: true }).gte('created_at', periodStart.toISOString()),
    db.from('photos').select('filter_status'),
    db.from('photos').select('aesthetic_score').not('aesthetic_score', 'is', null).limit(5000),
    db.from('rolls').select('status, film_profile'),
    db.from('rolls').select('id', { count: 'exact', head: true }).eq('status', 'developed').gte('updated_at', periodStart.toISOString()),
    db.from('print_orders').select('status, total_cents, is_free_first_roll'),
    db.from('print_orders').select('id', { count: 'exact', head: true }).gte('created_at', periodStart.toISOString()),
    db.from('circles').select('member_count'),
    db.from('circle_posts').select('id', { count: 'exact', head: true }),
    db.from('processing_jobs').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('processing_jobs').select('id', { count: 'exact', head: true }).eq('status', 'failed'),
    db.from('referrals').select('status'),
    db.from('photos').select('user_id').gte('created_at', weekAgo.toISOString()).limit(10000),
  ]);

  // Filter breakdown
  const filterBreakdown: Record<string, number> = {};
  if (filterStatusRes.data) {
    for (const p of filterStatusRes.data) {
      filterBreakdown[p.filter_status] = (filterBreakdown[p.filter_status] || 0) + 1;
    }
  }

  // Aesthetic avg
  let aestheticSum = 0;
  let aestheticCount = 0;
  if (aestheticRes.data) {
    for (const p of aestheticRes.data) {
      if (p.aesthetic_score != null) { aestheticSum += p.aesthetic_score; aestheticCount++; }
    }
  }

  // Roll breakdowns
  const rollStatus: Record<string, number> = {};
  const filmProfile: Record<string, number> = {};
  let errorCount = 0;
  if (rollsRes.data) {
    for (const r of rollsRes.data) {
      rollStatus[r.status] = (rollStatus[r.status] || 0) + 1;
      if (r.film_profile) filmProfile[r.film_profile] = (filmProfile[r.film_profile] || 0) + 1;
      if (r.status === 'error') errorCount++;
    }
  }

  // Order breakdowns
  const orderStatus: Record<string, number> = {};
  let totalRevenue = 0;
  let freeFirstRolls = 0;
  if (ordersRes.data) {
    for (const o of ordersRes.data) {
      orderStatus[o.status] = (orderStatus[o.status] || 0) + 1;
      if (o.total_cents) totalRevenue += o.total_cents;
      if (o.is_free_first_roll) freeFirstRolls++;
    }
  }

  // Circles avg members
  const circleMembers = circlesRes.data ?? [];
  const avgMembers = circleMembers.length > 0
    ? circleMembers.reduce((sum, c) => sum + c.member_count, 0) / circleMembers.length
    : 0;

  // Referral breakdown
  const refStats = { totalSent: 0, signedUp: 0, converted: 0 };
  if (referralsRes.data) {
    refStats.totalSent = referralsRes.data.length;
    for (const r of referralsRes.data) {
      if (r.status === 'signed_up') refStats.signedUp++;
      if (r.status === 'converted') refStats.converted++;
    }
  }

  // Active users (unique uploaders last 7d)
  const activeLast7d = new Set(activeUsersRes.data?.map(p => p.user_id) ?? []).size;

  const totalUsers = totalUsersRes.count ?? 0;

  return {
    period: { start: periodStart.toISOString(), end: now.toISOString() },
    users: {
      total: totalUsers,
      newThisPeriod: newUsersRes.count ?? 0,
      plusCount: plusUsersRes.count ?? 0,
      onboardingCompletionRate: totalUsers > 0 ? ((onboardedRes.count ?? 0) / totalUsers) * 100 : 0,
      activeLast7d,
    },
    photos: {
      total: totalPhotosRes.count ?? 0,
      uploadedThisPeriod: newPhotosRes.count ?? 0,
      filterBreakdown,
      avgAestheticScore: aestheticCount > 0 ? aestheticSum / aestheticCount : 0,
    },
    rolls: {
      total: rollsRes.data?.length ?? 0,
      developedThisPeriod: newDevelopedRes.count ?? 0,
      statusBreakdown: rollStatus,
      filmProfilePopularity: filmProfile,
      errorRate: rollsRes.data?.length ? (errorCount / rollsRes.data.length) * 100 : 0,
    },
    orders: {
      total: ordersRes.data?.length ?? 0,
      newThisPeriod: newOrdersRes.count ?? 0,
      statusBreakdown: orderStatus,
      totalRevenueCents: totalRevenue,
      avgOrderValueCents: ordersRes.data?.length ? Math.round(totalRevenue / ordersRes.data.length) : 0,
      freeFirstRollCount: freeFirstRolls,
    },
    circles: {
      total: circleMembers.length,
      totalPosts: postsRes.count ?? 0,
      avgMembers,
    },
    pipeline: {
      pendingJobs: pendingJobsRes.count ?? 0,
      failedJobs: failedJobsRes.count ?? 0,
    },
    referrals: refStats,
  };
}
