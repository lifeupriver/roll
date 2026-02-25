import { createHmac } from 'crypto';
import type { PrintOrder, PrintOrderItem, PrintSize } from '@/types/print';

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface ProdigiRecipient {
  name: string;
  address: {
    line1: string;
    line2?: string;
    postalOrZipCode: string;
    countryCode: string;
    townOrCity: string;
    stateOrCounty: string;
  };
}

export interface ProdigiAsset {
  printArea: string;
  url: string;
}

export interface ProdigiItem {
  sku: string;
  copies: number;
  assets: ProdigiAsset[];
}

export interface ProdigiOrderRequest {
  shippingMethod: string;
  recipient: ProdigiRecipient;
  items: ProdigiItem[];
  idempotencyKey?: string;
}

export interface ProdigiOrderResponse {
  id: string;
  status: string;
  created: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PRODIGI_API_URL = 'https://api.sandbox.prodigi.com/v4.0/orders';

function getApiKey(): string {
  const key = process.env.PRODIGI_API_KEY;
  if (!key) throw new Error('PRODIGI_API_KEY is not configured');
  return key;
}

function isFulfillmentEnabled(): boolean {
  return process.env.ENABLE_PRINT_FULFILLMENT === 'true';
}

// ---------------------------------------------------------------------------
// SKU mapping
// ---------------------------------------------------------------------------

const SKU_MAP: Record<PrintSize, string> = {
  '3x5': 'GLOBAL-PHO-3.5x5-GLOSSY',
  '4x6': 'GLOBAL-PHO-4x6-GLOSSY',
  '5x7': 'GLOBAL-PHO-5x7-GLOSSY',
  '8x10': 'GLOBAL-PHO-8x10-GLOSSY',
  '6x6': 'GLOBAL-PHO-6x6-SOFTCOVER',
  '8x8': 'GLOBAL-PHO-8x8-SOFTCOVER',
  '10x10': 'GLOBAL-PHO-10x10-SOFTCOVER',
};

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/**
 * Build the public URL for a processed photo so Prodigi can fetch it.
 * Uses the R2_PUBLIC_URL env var plus the processed storage key.
 */
function buildAssetUrl(processedStorageKey: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL || 'https://photos.roll.photos';
  return `${publicUrl}/${processedStorageKey}`;
}

/**
 * Submit an order to Prodigi, or return a simulated response when
 * fulfillment is disabled.
 */
export async function createProdigiOrder(
  order: PrintOrder,
  items: PrintOrderItem[],
): Promise<ProdigiOrderResponse> {
  // ---- Build the request body ----
  const prodigiItems: ProdigiItem[] = items.map((item) => ({
    sku: SKU_MAP[order.print_size],
    copies: 1,
    assets: [
      {
        printArea: 'default',
        url: buildAssetUrl(item.processed_storage_key),
      },
    ],
  }));

  const requestBody: ProdigiOrderRequest = {
    shippingMethod: 'Standard',
    idempotencyKey: order.id,
    recipient: {
      name: order.shipping_name,
      address: {
        line1: order.shipping_line1,
        line2: order.shipping_line2 || undefined,
        townOrCity: order.shipping_city,
        stateOrCounty: order.shipping_state,
        postalOrZipCode: order.shipping_postal_code,
        countryCode: order.shipping_country,
      },
    },
    items: prodigiItems,
  };

  // ---- Simulated mode ----
  if (!isFulfillmentEnabled()) {
    const simId = `SIM-${order.id.slice(0, 8)}`;
    return {
      id: simId,
      status: 'simulated',
      created: new Date().toISOString(),
    };
  }

  // ---- Real Prodigi call ----
  const apiKey = getApiKey();

  const response = await fetch(PRODIGI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Prodigi API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  return {
    id: data.order?.id ?? data.id,
    status: data.order?.status?.stage ?? 'submitted',
    created: data.order?.created ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

/**
 * Verify that a webhook payload was signed by Prodigi using HMAC SHA-256.
 * Returns `true` when the computed signature matches.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const secret = process.env.PRODIGI_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('PRODIGI_WEBHOOK_SECRET is not configured');
  }

  const expected = createHmac('sha256', secret).update(body).digest('hex');

  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}
