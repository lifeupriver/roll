import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/middleware';
import { getServiceClient } from '@/lib/admin/service';
import { captureError } from '@/lib/sentry';

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const db = getServiceClient();

    const [
      totalUsersRes,
      onboardedRes,
      uploadersRes,
      rollCreatorsRes,
      developedRes,
      orderedRes,
      plusRes,
      referralsRes,
    ] = await Promise.all([
      db.from('profiles').select('id', { count: 'exact', head: true }),
      db
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('onboarding_complete', true),
      db.from('photos').select('user_id').limit(10000),
      db.from('rolls').select('user_id').limit(10000),
      db.from('rolls').select('user_id').eq('status', 'developed').limit(10000),
      db.from('print_orders').select('user_id').limit(10000),
      db.from('profiles').select('id', { count: 'exact', head: true }).eq('tier', 'plus'),
      db.from('referrals').select('status'),
    ]);

    const totalUsers = totalUsersRes.count ?? 0;
    const onboarded = onboardedRes.count ?? 0;
    const uniqueUploaders = new Set(uploadersRes.data?.map((p) => p.user_id) ?? []).size;
    const uniqueRollCreators = new Set(rollCreatorsRes.data?.map((r) => r.user_id) ?? []).size;
    const uniqueDeveloped = new Set(developedRes.data?.map((r) => r.user_id) ?? []).size;
    const uniqueOrdered = new Set(orderedRes.data?.map((o) => o.user_id) ?? []).size;
    const plusCount = plusRes.count ?? 0;

    // Referral stats
    const referralStats = { total: 0, signedUp: 0, converted: 0 };
    if (referralsRes.data) {
      referralStats.total = referralsRes.data.length;
      for (const r of referralsRes.data) {
        if (r.status === 'signed_up') referralStats.signedUp++;
        if (r.status === 'converted') referralStats.converted++;
      }
    }

    // Funnel
    const funnel = [
      { step: 'Signed Up', count: totalUsers },
      { step: 'Onboarded', count: onboarded },
      { step: 'Uploaded Photos', count: uniqueUploaders },
      { step: 'Created Roll', count: uniqueRollCreators },
      { step: 'Developed Roll', count: uniqueDeveloped },
      { step: 'Placed Order', count: uniqueOrdered },
      { step: 'Upgraded to Plus', count: plusCount },
    ];

    return NextResponse.json({ funnel, referrals: referralStats });
  } catch (err) {
    captureError(err, { context: 'admin-growth' });
    return NextResponse.json({ error: 'Failed to load growth data' }, { status: 500 });
  }
}
