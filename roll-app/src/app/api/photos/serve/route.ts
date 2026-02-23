import { NextRequest, NextResponse } from 'next/server';

// GET /api/photos/serve?key=... — serve a photo by storage key
// For real photos, this would generate a signed R2 URL.
// For mock data or external URLs, it redirects directly.
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'key parameter required' }, { status: 400 });
  }

  // If the key is already an absolute URL (mock data), redirect to it
  if (key.startsWith('http://') || key.startsWith('https://')) {
    return NextResponse.redirect(key);
  }

  // For real storage keys, construct the R2/CDN URL
  const publicUrl = process.env.R2_PUBLIC_URL;
  if (publicUrl) {
    return NextResponse.redirect(`${publicUrl}/${key}`);
  }

  // Fallback: return a placeholder
  return NextResponse.redirect(`https://picsum.photos/seed/${encodeURIComponent(key)}/300/400`);
}
