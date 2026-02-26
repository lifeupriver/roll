import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

/**
 * POST /api/cron/monthly-backup-email
 * Runs on 1st of each month — sends backup summary email to users.
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

    // Get all users with photos
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, photo_count')
      .gt('photo_count', 0)
      .limit(1000);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    let emailsSent = 0;
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    for (const profile of profiles ?? []) {
      try {
        // Check deduplication
        const { data: recentNotif } = await supabase
          .from('notification_history')
          .select('id')
          .eq('user_id', profile.id)
          .eq('notification_type', 'monthly_backup_email')
          .gte('sent_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
          .limit(1);

        if (recentNotif && recentNotif.length > 0) continue;

        // Get this month's favorites count
        const { count: favCount } = await supabase
          .from('favorites')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString());

        // Send email via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Roll <noreply@roll.photos>',
              to: profile.email,
              subject: `Your ${monthName} photos are safe`,
              html: `
                <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto;">
                  <h1 style="font-size: 24px;">Your photos are safe.</h1>
                  <p style="color: #666; font-size: 16px; line-height: 1.6;">
                    ${profile.photo_count} photos backed up and protected.
                    ${favCount ? `${favCount} new favorites this month.` : ''}
                  </p>
                  <p style="color: #999; font-size: 14px;">
                    Encrypted in transit and at rest. Never used for training. Always yours.
                  </p>
                </div>
              `,
            }),
          });
        }

        // Record notification
        await supabase.from('notification_history').insert({
          user_id: profile.id,
          notification_type: 'monthly_backup_email',
          metadata: { photo_count: profile.photo_count, fav_count: favCount ?? 0 },
        });

        emailsSent++;
      } catch {
        // Continue with other users
      }
    }

    return NextResponse.json({
      data: { users_processed: (profiles ?? []).length, emails_sent: emailsSent },
    });
  } catch (err) {
    captureError(err, { context: 'monthly-backup-email-cron' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
