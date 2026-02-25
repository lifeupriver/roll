import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createClient(url, key);
}

// GET /api/gallery/[slug]/embed — returns embeddable HTML for iframe embedding
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceSupabase();

    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id, title, user_id, public_settings, is_public')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (rollError || !roll) {
      return new NextResponse('Gallery not found', { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, business_logo_url, business_accent_color')
      .eq('id', roll.user_id)
      .single();

    const { data: rollPhotos } = await supabase
      .from('roll_photos')
      .select('photos(thumbnail_url)')
      .eq('roll_id', roll.id)
      .order('position', { ascending: true })
      .limit(50);

    const thumbnails = (rollPhotos ?? []).map((rp: Record<string, unknown>) => {
      const photo = rp.photos as Record<string, unknown> | null;
      return (photo?.thumbnail_url as string) || '';
    }).filter(Boolean);

    const accentColor = (roll.public_settings as Record<string, unknown>)?.accent_color
      || profile?.business_accent_color
      || '#1a1a1a';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${roll.title || 'Gallery'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #fafafa; }
    .header { padding: 16px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #eee; }
    .header img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
    .header h1 { font-size: 16px; font-weight: 600; color: ${accentColor}; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 4px; padding: 4px; }
    .grid img { width: 100%; aspect-ratio: 1; object-fit: cover; }
    .footer { padding: 12px; text-align: center; }
    .footer a { font-size: 12px; color: #999; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    ${profile?.business_logo_url ? `<img src="${profile.business_logo_url}" alt="">` : ''}
    <h1>${profile?.business_name || roll.title || 'Gallery'}</h1>
  </div>
  <div class="grid">
    ${thumbnails.map((url: string) => `<img src="${url}" loading="lazy" alt="">`).join('\n    ')}
  </div>
  <div class="footer">
    <a href="${appUrl}/gallery/${slug}" target="_blank">View full gallery on Roll</a>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL',
      },
    });
  } catch (err) {
    captureError(err, { context: 'gallery-embed' });
    return new NextResponse('Internal server error', { status: 500 });
  }
}
