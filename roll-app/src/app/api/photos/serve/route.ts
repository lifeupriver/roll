import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Allowed hostnames for external URL redirects (mock data, CDN)
const ALLOWED_REDIRECT_HOSTS = [
  'picsum.photos',
  'photos.roll.photos',
];

// Generate a simple SVG placeholder for fallback
function fallbackSvg(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  const h = Math.abs(hash) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="hsl(${h},55%,60%)"/><circle cx="105" cy="120" r="36" fill="hsl(${h},40%,45%)" opacity="0.3"/><polygon points="30,280 120,160 210,260" fill="hsl(${h},40%,45%)" opacity="0.15"/><rect x="0" y="220" width="300" height="180" fill="hsl(${h},40%,45%)" opacity="0.2"/></svg>`;
}

// GET /api/photos/serve?key=... — serve a photo by storage key
// For real photos, this constructs a signed R2 URL.
// For mock data, it redirects to allowed external URLs or serves SVG data inline.
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

  // Handle data: URIs (inline SVG placeholders from mock data)
  if (key.startsWith('data:')) {
    // Handle base64-encoded SVG
    const b64Match = key.match(/^data:image\/svg\+xml;base64,(.+)$/);
    if (b64Match) {
      const svgContent = Buffer.from(b64Match[1], 'base64').toString('utf-8');
      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    // Handle URL-encoded SVG
    const urlMatch = key.match(/^data:image\/svg\+xml,(.+)$/);
    if (urlMatch) {
      const svgContent = decodeURIComponent(urlMatch[1]);
      return new NextResponse(svgContent, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    // For other data URIs, return a fallback
    const svg = fallbackSvg(key);
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
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

  // Fallback: serve a generated SVG placeholder
  const svg = fallbackSvg(key);
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
