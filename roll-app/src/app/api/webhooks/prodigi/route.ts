import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyWebhookSignature } from '@/lib/prodigi';
import { captureError } from '@/lib/sentry';
import type { PrintOrderStatus } from '@/types/print';

// Webhook handlers need service role client to bypass RLS (no user session available)
function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service role configuration for webhooks');
  }
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Stage -> PrintOrderStatus mapping
// ---------------------------------------------------------------------------

const STAGE_STATUS_MAP: Record<string, PrintOrderStatus> = {
  InProgress: 'in_production',
  Complete: 'delivered',
  Cancelled: 'cancelled',
};

// ---------------------------------------------------------------------------
// POST /api/webhooks/prodigi — handle incoming Prodigi webhook events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // Read raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature
    const signature = request.headers.get('X-Prodigi-Signature') ?? '';
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventType: string = payload.type ?? payload.event ?? '';
    const orderData = payload.data?.order ?? payload.order ?? {};
    const prodigiOrderId: string | undefined = orderData.id;

    if (!prodigiOrderId) {
      return NextResponse.json({ error: 'Missing order ID in payload' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Look up the order by its Prodigi ID
    const { data: order, error: lookupError } = await supabase
      .from('print_orders')
      .select('id')
      .eq('prodigi_order_id', prodigiOrderId)
      .single();

    if (lookupError || !order) {
      // We don't have this order — acknowledge anyway to stop retries
      return NextResponse.json({ received: true });
    }

    // Build the update payload based on event type
    const updateData: Record<string, unknown> = {};

    if (eventType === 'order.status.stage.changed') {
      const stage: string = orderData.status?.stage ?? '';
      const mappedStatus = STAGE_STATUS_MAP[stage];
      if (mappedStatus) {
        updateData.status = mappedStatus;
      }
    } else if (eventType === 'order.shipped') {
      updateData.status = 'shipped' as PrintOrderStatus;

      // Extract tracking URL from shipment details
      const shipments = orderData.shipments ?? [];
      if (shipments.length > 0) {
        const trackingUrl =
          shipments[0].tracking?.url ??
          shipments[0].trackingUrl ??
          null;
        if (trackingUrl) {
          updateData.tracking_url = trackingUrl;
        }
      }
    }

    // Apply update if we have anything to change
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('print_orders')
        .update(updateData)
        .eq('id', order.id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    captureError(err, { context: 'prodigi-webhook' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
