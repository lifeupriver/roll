import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { captureError } from '@/lib/sentry';
import { buildMagazineOrder, calculateMagazinePrice } from '@/lib/prodigi/magazine';
import { buildAssetUrl } from '@/lib/prodigi';
import type { MagazineFormat } from '@/types/magazine';

// POST /api/magazines/[id]/order — submit magazine to Prodigi for printing
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch magazine
    const { data: magazine, error: lookupError } = await supabase
      .from('magazines')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (lookupError || !magazine) {
      return NextResponse.json({ error: 'Magazine not found' }, { status: 404 });
    }

    if (magazine.status !== 'draft' && magazine.status !== 'review') {
      return NextResponse.json({ error: 'Magazine has already been ordered' }, { status: 400 });
    }

    const body = await request.json();
    const { shippingAddress, quantity = 1 } = body;
    const copies = Math.max(1, Math.min(10, Math.floor(Number(quantity) || 1)));

    if (
      !shippingAddress?.name ||
      !shippingAddress?.line1 ||
      !shippingAddress?.postalCode ||
      !shippingAddress?.country
    ) {
      return NextResponse.json({ error: 'Complete shipping address is required' }, { status: 400 });
    }

    // Parse pages to get photo IDs for URL generation
    const pages = typeof magazine.pages === 'string' ? JSON.parse(magazine.pages) : magazine.pages;
    const photoIds = pages
      .flatMap((p: { photos?: { id: string }[] }) =>
        (p.photos ?? []).map((ph: { id: string }) => ph.id)
      )
      .filter(Boolean);

    // Fetch photo storage keys for direct CDN URLs (not authenticated /api/photos/serve)
    const { data: photos } = await supabase
      .from('photos')
      .select('id, storage_key')
      .in('id', photoIds.length > 0 ? photoIds : ['__none__']);

    const photoUrlMap = new Map<string, string>();
    (photos ?? []).forEach((p: { id: string; storage_key: string }) => {
      photoUrlMap.set(p.id, buildAssetUrl(p.storage_key));
    });

    // Build page URLs (in order)
    const pageUrls = pages
      .filter((p: { photos?: unknown[] }) => (p.photos ?? []).length > 0)
      .flatMap((p: { photos?: { id: string }[] }) =>
        (p.photos ?? []).map((ph: { id: string }) => photoUrlMap.get(ph.id) || '')
      )
      .filter(Boolean);

    // Cover URL
    let coverUrl = '';
    if (magazine.cover_photo_id) {
      const { data: coverPhoto } = await supabase
        .from('photos')
        .select('storage_key')
        .eq('id', magazine.cover_photo_id)
        .single();
      coverUrl = coverPhoto?.storage_key
        ? buildAssetUrl(coverPhoto.storage_key)
        : pageUrls[0] || '';
    } else {
      coverUrl = pageUrls[0] || '';
    }

    // Build the Prodigi order
    const prodigiOrder = buildMagazineOrder({
      magazineId: id,
      format: magazine.format as MagazineFormat,
      pageUrls,
      coverUrl,
      recipient: {
        name: shippingAddress.name,
        line1: shippingAddress.line1,
        line2: shippingAddress.line2,
        postalOrZipCode: shippingAddress.postalCode,
        countryCode: shippingAddress.country,
        townOrCity: shippingAddress.city,
        stateOrCounty: shippingAddress.state,
      },
      shippingMethod: body.shippingMethod || 'Budget',
      copies,
    });

    // Submit to Prodigi
    const prodigiApiKey = process.env.PRODIGI_API_KEY;
    const prodigiBaseUrl = process.env.PRODIGI_API_URL || 'https://api.prodigi.com/v4.0';

    const prodigiRes = await fetch(`${prodigiBaseUrl}/Orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': prodigiApiKey || '',
      },
      body: JSON.stringify(prodigiOrder),
    });

    if (!prodigiRes.ok) {
      const errBody = await prodigiRes.text();
      captureError(new Error(`Prodigi order failed: ${errBody}`), { context: 'magazine-order' });
      return NextResponse.json({ error: 'Failed to submit print order' }, { status: 502 });
    }

    const prodigiData = await prodigiRes.json();
    const prodigiOrderId = prodigiData.order?.id;

    // Update magazine status
    const unitPriceCents = calculateMagazinePrice(magazine.format as MagazineFormat, pages.length);
    const totalPriceCents = unitPriceCents * copies;
    await supabase
      .from('magazines')
      .update({
        status: 'ordered',
        prodigi_order_id: prodigiOrderId,
        price_cents: totalPriceCents,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    return NextResponse.json({
      data: {
        orderId: prodigiOrderId,
        priceCents: totalPriceCents,
        status: 'ordered',
      },
    });
  } catch (err) {
    captureError(err, { context: 'magazine-order' });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
