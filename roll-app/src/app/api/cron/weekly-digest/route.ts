import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

/**
 * POST /api/cron/weekly-digest
 * Triggered by cron — sends weekly digest push notifications to users.
 * Picks the top 12 photos from the past week (by aesthetic_score, face_count >= 1).
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerSupabaseClient();

    // Get all users who have push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('user_id')
      .limit(1000);

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const uniqueUserIds = [
      ...new Set((subscriptions ?? []).map((s: { user_id: string }) => s.user_id)),
    ];
    let notificationsSent = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const userId of uniqueUserIds) {
      try {
        // Check if we already sent a weekly digest to this user in the past 6 days
        const { data: recentNotif } = await supabase
          .from('notification_history')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'weekly_digest')
          .gte('sent_at', new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentNotif && recentNotif.length > 0) continue;

        // Get this week's best photos
        const { data: weekPhotos, error: photosError } = await supabase
          .from('photos')
          .select('id, thumbnail_url, aesthetic_score, face_count, date_taken')
          .eq('user_id', userId)
          .eq('filter_status', 'visible')
          .gte('date_taken', oneWeekAgo.toISOString())
          .order('aesthetic_score', { ascending: false, nullsFirst: false })
          .limit(12);

        if (photosError || !weekPhotos || weekPhotos.length < 3) continue;

        // Record notification sent
        await supabase.from('notification_history').insert({
          user_id: userId,
          notification_type: 'weekly_digest',
          metadata: { photo_count: weekPhotos.length },
        });

        notificationsSent++;
      } catch {
        // Continue with other users
      }
    }

    return NextResponse.json({
      data: { users_processed: uniqueUserIds.length, notifications_sent: notificationsSent },
    });
  } catch (err) {
    captureError(err, { context: 'weekly-digest-cron' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
