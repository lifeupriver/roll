import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

// Service-role client for public access (no auth required)
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase service role config');
  return createClient(url, key);
}

// GET /api/gallery/[slug] — public gallery data (no auth required)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const supabase = getServiceSupabase();

    // Find the public roll by slug
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('id, title, description, user_id, public_settings, is_public')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Gallery not found' }, { status: 404 });
    }

    // Fetch business profile info (including blog slug for migration)
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, business_logo_url, business_accent_color, display_name, blog_slug, blog_enabled')
      .eq('id', roll.user_id)
      .single();

    // Fetch developed photos for this roll
    const { data: rollPhotos } = await supabase
      .from('roll_photos')
      .select(
        'photo_id, position, caption, photos(id, thumbnail_url, developed_url, width, height)'
      )
      .eq('roll_id', roll.id)
      .order('position', { ascending: true });

    const photos = (rollPhotos ?? []).map((rp: Record<string, unknown>) => {
      const photo = rp.photos as Record<string, unknown> | null;
      return {
        id: photo?.id || rp.photo_id,
        thumbnail_url: photo?.thumbnail_url || '',
        developed_url: photo?.developed_url || '',
        width: photo?.width || 0,
        height: photo?.height || 0,
        caption: rp.caption || undefined,
      };
    });

    return NextResponse.json({
      data: {
        slug,
        roll_id: roll.id,
        title: roll.title,
        description: roll.description,
        photo_count: photos.length,
        settings: roll.public_settings || {},
        business_name: profile?.business_name || profile?.display_name || null,
        business_logo_url: profile?.business_logo_url || null,
        blog_slug: profile?.blog_enabled ? profile?.blog_slug : null,
        photos,
      },
    });
  } catch (err) {
    captureError(err, { context: 'public-gallery' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
