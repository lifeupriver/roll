import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createClient(url, key);
}

// POST /api/cron/book-nudge — send "finish your book" email nudges
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const now = new Date();

    // Find books/magazines that are still in draft status
    // Nudge at: 3 days, 7 days, 30 days after creation
    const nudgeWindows = [
      { daysAgo: 3, label: '3_day', subject: 'Your book is waiting for captions' },
      { daysAgo: 7, label: '7_day', subject: 'Your photo book is ready to print' },
      { daysAgo: 30, label: '30_day', subject: 'You started a photo book 30 days ago' },
    ];

    const results: { email: string; nudge: string }[] = [];

    for (const window of nudgeWindows) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - window.daysAgo);
      const dayStart = targetDate.toISOString().slice(0, 10) + 'T00:00:00Z';
      const dayEnd = targetDate.toISOString().slice(0, 10) + 'T23:59:59Z';

      // Check collections (books) in draft
      const { data: draftBooks } = await supabase
        .from('collections')
        .select('id, user_id, name, created_at, profiles(email, display_name)')
        .eq('type', 'album')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      // Check magazines in draft
      const { data: draftMagazines } = await supabase
        .from('magazines')
        .select('id, user_id, title, status, created_at')
        .eq('status', 'draft')
        .gte('created_at', dayStart)
        .lte('created_at', dayEnd);

      // Check notification_history to avoid duplicate nudges
      const userIds = [
        ...(draftBooks ?? []).map((b: Record<string, unknown>) => b.user_id),
        ...(draftMagazines ?? []).map((m: Record<string, unknown>) => m.user_id),
      ];

      if (userIds.length === 0) continue;

      const { data: alreadySent } = await supabase
        .from('notification_history')
        .select('user_id')
        .eq('notification_type', `book_nudge_${window.label}`)
        .in('user_id', userIds);

      const sentSet = new Set((alreadySent ?? []).map((n: { user_id: string }) => n.user_id));

      // Send nudge emails
      for (const book of [...(draftBooks ?? []), ...(draftMagazines ?? [])]) {
        const userId = book.user_id as string;
        if (sentSet.has(userId)) continue;

        const profile = (book as Record<string, unknown>).profiles as Record<
          string,
          unknown
        > | null;
        const email = profile?.email as string;
        if (!email) continue;

        // Send via Resend
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
          const title =
            (book as Record<string, unknown>).name ||
            (book as Record<string, unknown>).title ||
            'your photo book';
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: 'Roll <hello@roll.photos>',
              to: email,
              subject: window.subject,
              html: `<p>Hi ${profile?.display_name || 'there'},</p>
                <p>${
                  window.daysAgo === 3
                    ? `Your book "${title}" has pages but no captions yet. Add a few words while the memories are fresh?`
                    : window.daysAgo === 7
                      ? `Your "${title}" is ready to print. Order now while the moment is fresh.`
                      : `You started "${title}" 30 days ago. It's still waiting for you.`
                }</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/projects">Open your projects</a></p>`,
            }),
          });
        }

        // Record in notification history
        await supabase.from('notification_history').insert({
          user_id: userId,
          notification_type: `book_nudge_${window.label}`,
          channel: 'email',
          sent_at: new Date().toISOString(),
        });

        results.push({ email, nudge: window.label });
      }
    }

    return NextResponse.json({ sent: results.length, results });
  } catch (err) {
    captureError(err, { context: 'book-nudge-cron' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
