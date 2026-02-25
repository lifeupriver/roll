import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';
import { autoDesignMagazine, selectCoverPhoto } from '@/lib/magazine/auto-design';
import { calculateMagazinePrice } from '@/lib/prodigi/magazine';
import type { MagazineTemplate, MagazineFormat } from '@/types/magazine';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createClient(url, key);
}

// POST /api/cron/magazine-subscription — monthly cron to auto-generate magazines for subscribers
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    const today = new Date().toISOString().slice(0, 10);

    // Find active subscriptions due for generation
    const { data: subscriptions, error: subError } = await supabase
      .from('magazine_subscriptions')
      .select('*')
      .eq('status', 'active')
      .lte('next_issue_date', today);

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    const results: { userId: string; magazineId?: string; error?: string }[] = [];

    for (const sub of subscriptions ?? []) {
      try {
        // Calculate date range for this issue
        const end = new Date();
        const start = new Date();
        start.setMonth(start.getMonth() - (sub.frequency === 'monthly' ? 1 : 3));

        // Fetch user's favorites in the date range
        const { data: favorites } = await supabase
          .from('favorites')
          .select('id, photo_id, photos(id, thumbnail_url, developed_url, width, height, taken_at, aesthetic_score, face_count)')
          .eq('user_id', sub.user_id)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: true });

        if (!favorites || favorites.length === 0) {
          results.push({ userId: sub.user_id, error: 'No favorites in period' });
          continue;
        }

        // Prepare photos
        const designPhotos = favorites.map((f: Record<string, unknown>) => {
          const photo = f.photos as Record<string, unknown> | null;
          return {
            id: f.id as string,
            photo_id: f.photo_id as string,
            thumbnail_url: (photo?.thumbnail_url as string) || '',
            width: (photo?.width as number) || 0,
            height: (photo?.height as number) || 0,
            taken_at: (photo?.taken_at as string) || undefined,
            aesthetic_score: (photo?.aesthetic_score as number) || undefined,
            face_count: (photo?.face_count as number) || undefined,
          };
        });

        // Auto-design
        const pages = autoDesignMagazine(designPhotos, sub.template as MagazineTemplate, { start, end });
        const coverId = selectCoverPhoto(designPhotos);
        const priceCents = calculateMagazinePrice(sub.format as MagazineFormat, pages.length);

        const monthName = end.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Create the magazine
        const { data: magazine, error: createError } = await supabase
          .from('magazines')
          .insert({
            user_id: sub.user_id,
            title: `${monthName} Magazine`,
            template: sub.template,
            format: sub.format,
            date_range_start: start.toISOString().slice(0, 10),
            date_range_end: end.toISOString().slice(0, 10),
            cover_photo_id: coverId,
            pages: JSON.stringify(pages),
            page_count: pages.length,
            price_cents: priceCents,
            status: 'ordered',
          })
          .select()
          .single();

        if (createError) {
          results.push({ userId: sub.user_id, error: createError.message });
          continue;
        }

        // Update next issue date
        const nextDate = new Date();
        nextDate.setMonth(nextDate.getMonth() + (sub.frequency === 'monthly' ? 1 : 3));
        await supabase
          .from('magazine_subscriptions')
          .update({ next_issue_date: nextDate.toISOString().slice(0, 10) })
          .eq('id', sub.id);

        results.push({ userId: sub.user_id, magazineId: magazine?.id });
      } catch (subErr) {
        results.push({
          userId: sub.user_id,
          error: subErr instanceof Error ? subErr.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (err) {
    captureError(err, { context: 'magazine-subscription-cron' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
