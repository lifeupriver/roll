import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';

// Allowed hostnames for external URL redirects (mock data, CDN)
const ALLOWED_REDIRECT_HOSTS = [
  'picsum.photos',
  'photos.roll.photos',
];

// GET /api/photos/serve?key=... — serve a photo by storage key
// For real photos, this constructs a signed R2 URL.
// For mock data, it redirects to allowed external URLs only.
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'key parameter required' }, { status: 400 });
  }

  // If the key is already an absolute URL (mock data), validate the host before redirecting
  if (key.startsWith('http://') || key.startsWith('https://')) {
    let url: URL;
    try {
      url = new URL(key);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    const isAllowed = ALLOWED_REDIRECT_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith('.' + host)
    );
    if (!isAllowed) {
      return NextResponse.json({ error: 'Redirect target not allowed' }, { status: 403 });
    }

    return NextResponse.redirect(url.toString());
  }

  // For real storage keys, construct the R2/CDN URL
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return NextResponse.redirect(`${publicUrl}/${key}`);
  }

  // Fallback: return a placeholder
  return NextResponse.redirect(`https://picsum.photos/seed/${encodeURIComponent(key)}/300/400`);
}
