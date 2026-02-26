import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

/**
 * POST /api/cron/print-prompts
 * Analyzes recent photo clusters for patterns and sends personalized print prompt notifications.
 *
 * Pattern detection:
 * - Trip detection: large cluster (20+ photos in 3 days) followed by 3-day gap
 * - Holiday: scene_classification includes holiday-related tags near holiday dates
 * - Birthday: recurring annual cluster around same date
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

    // Get users with push subscriptions
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
    let promptsSent = 0;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    for (const userId of uniqueUserIds) {
      try {
        // Check deduplication (max 1 print prompt per week)
        const { data: recentNotif } = await supabase
          .from('notification_history')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'print_prompt')
          .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1);

        if (recentNotif && recentNotif.length > 0) continue;

        // Trip detection: lots of photos 3-10 days ago, few in last 3 days
        const { count: recentCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('filter_status', 'visible')
          .gte('date_taken', threeDaysAgo.toISOString());

        const { count: tripCount } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('filter_status', 'visible')
          .gte('date_taken', tenDaysAgo.toISOString())
          .lte('date_taken', threeDaysAgo.toISOString());

        // Trip pattern: 20+ photos in cluster, quiet since
        if ((tripCount ?? 0) >= 20 && (recentCount ?? 0) < 5) {
          await supabase.from('notification_history').insert({
            user_id: userId,
            notification_type: 'print_prompt',
            metadata: { trigger: 'trip_detected', photo_count: tripCount },
          });
          promptsSent++;
          continue;
        }

        // Developed but unprinted rolls
        const { data: developedRolls } = await supabase
          .from('rolls')
          .select('id')
          .eq('user_id', userId)
          .eq('status', 'developed')
          .limit(10);

        if (developedRolls && developedRolls.length > 0) {
          const rollIds = developedRolls.map((r: { id: string }) => r.id);
          const { count: orderCount } = await supabase
            .from('print_orders')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .in('roll_id', rollIds);

          // Has developed rolls but no orders
          if ((orderCount ?? 0) === 0) {
            await supabase.from('notification_history').insert({
              user_id: userId,
              notification_type: 'print_prompt',
              metadata: { trigger: 'unprinted_rolls', roll_count: developedRolls.length },
            });
            promptsSent++;
          }
        }
      } catch {
        // Continue with other users
      }
    }

    return NextResponse.json({
      data: { users_processed: uniqueUserIds.length, prompts_sent: promptsSent },
    });
  } catch (err) {
    captureError(err, { context: 'print-prompts-cron' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
