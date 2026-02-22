# Roll — API Integrations

> Third-party service integration specifications for eyeQ (color correction), Prodigi (print fulfillment), Cloudflare R2 (photo storage), and Resend (transactional email).

---

## 1. eyeQ / Perfectly Clear — Cloud Color Correction

### 1.1 Overview

eyeQ (by EyeQ Imaging, formerly Athentech) handles automated photo correction: white balance, exposure, skin tone accuracy, scene detection, sharpening, and noise reduction. This is what transforms phone snapshots into photos that look like they were shot on proper gear.

**Prototype approach:** eyeQ Web API (cloud). Post-prototype: self-hosted Docker container for cost and latency control.

### 1.2 API Details

```
Base URL: https://api.perfectlyclear.com/v3
Auth: Bearer token (EYEQ_API_KEY)
Format: REST, JSON request/response
Rate limit: 100 requests/minute (check contract)
Cost: ~$0.02–$0.05 per photo (volume dependent)
```

### 1.3 Correction Request

```typescript
// POST https://api.perfectlyclear.com/v3/correct
interface EyeQRequest {
  image_url: string;        // Signed R2 URL (1-hour expiry)
  preset: string;           // 'roll_standard' (custom preset configured in eyeQ Workbench)
  output_format: 'jpeg';
  output_quality: 95;       // High quality; Roll's LUT pipeline handles final compression
  corrections?: {
    exposure?: boolean;     // Default: true
    white_balance?: boolean;
    skin_tone?: boolean;
    sharpening?: boolean;
    noise_reduction?: boolean;
    scene_detection?: boolean;
  };
}

interface EyeQResponse {
  status: 'success' | 'error';
  corrected_url: string;    // Temporary URL to download corrected image (expires in 1 hour)
  corrections_applied: string[];
  processing_time_ms: number;
  error?: {
    code: string;
    message: string;
  };
}
```

### 1.4 Custom Preset: `roll_standard`

Configure in eyeQ Workbench:
- **Exposure correction:** moderate (preserve artistic intent, don't flatten everything)
- **White balance:** auto with bias toward warm (aligns with Roll's warm aesthetic)
- **Skin tone accuracy:** high priority (parents photograph children)
- **Sharpening:** light (avoid oversharpening phone photos)
- **Noise reduction:** moderate (clean up phone sensor noise without mushiness)
- **Scene detection:** enabled (adapts corrections to portrait vs landscape vs indoor)

### 1.5 Integration Flow

```typescript
// src/lib/processing/eyeq.ts
async function correctWithEyeQ(storageKey: string): Promise<Buffer> {
  // 1. Generate signed URL for the original
  const signedUrl = await getReadUrl(storageKey, 3600);

  // 2. Call eyeQ API
  const response = await fetch(`${EYEQ_API_URL}/correct`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${EYEQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: signedUrl,
      preset: EYEQ_PRESET,
      output_format: 'jpeg',
      output_quality: 95,
    }),
  });

  if (!response.ok) {
    throw new EyeQError(`eyeQ returned ${response.status}`, await response.text());
  }

  const result: EyeQResponse = await response.json();
  if (result.status === 'error') {
    throw new EyeQError(result.error!.code, result.error!.message);
  }

  // 3. Download corrected image
  const correctedResponse = await fetch(result.corrected_url);
  return Buffer.from(await correctedResponse.arrayBuffer());
}
```

### 1.6 Fallback Behavior

If eyeQ fails (API down, rate limited, error):
1. Log the error with photo ID and roll ID
2. Mark the photo with `correction_applied: false` in `roll_photos`
3. Proceed with LUT application on the original (no color correction)
4. Increment `rolls.correction_skipped_count`
5. Continue processing remaining photos (don't halt the entire roll)

---

## 2. Prodigi — Print Fulfillment

### 2.1 Overview

Prodigi is a global print-on-demand fulfillment network. They handle printing on Fujifilm Frontier printers, packaging, and shipping. Roll uses their API to submit print orders and track status via webhooks.

### 2.2 API Details

```
Base URL (Sandbox): https://api.sandbox.prodigi.com/v4.0
Base URL (Production): https://api.prodigi.com/v4.0
Auth: X-API-Key header
Format: REST, JSON
```

### 2.3 Create Order

```typescript
// POST /v4.0/orders
interface ProdigiOrderRequest {
  shippingMethod: 'Standard' | 'Express';
  recipient: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      postalOrZipCode: string;
      countryCode: string;  // ISO 3166-1 alpha-2
      townOrCity: string;
      stateOrCounty?: string;
    };
  };
  items: Array<{
    sku: string;            // 'GLOBAL-PHO-4x6-GLOSSY' or 'GLOBAL-PHO-5x7-GLOSSY'
    copies: 1;
    sizing: 'fillPrintArea';
    assets: Array<{
      printArea: 'default';
      url: string;          // Signed R2 URL (24-hour expiry)
    }>;
  }>;
  metadata?: {
    rollId: string;
    userId: string;
    isFreeFirstRoll: string;
  };
}

interface ProdigiOrderResponse {
  id: string;               // Prodigi order ID
  status: {
    stage: 'InProgress' | 'Complete' | 'Cancelled';
    issues: Array<{
      objectId: string;
      errorCode: string;
      description: string;
    }>;
  };
  charges: Array<{
    id: string;
    totalCost: { amount: string; currency: string };
  }>;
  shipments: Array<{
    id: string;
    carrier: { name: string; service: string };
    tracking: { url: string; number: string };
  }>;
}
```

### 2.4 SKU Reference

| Product | SKU | Dimensions | Paper |
|---|---|---|---|
| 4×6 print | `GLOBAL-PHO-4x6-GLOSSY` | 4" × 6" | Glossy photo paper |
| 5×7 print | `GLOBAL-PHO-5x7-GLOSSY` | 5" × 7" | Glossy photo paper |

### 2.5 Webhook Events

Register webhook URL: `https://roll.photos/api/webhooks/prodigi`

```typescript
interface ProdigiWebhook {
  event: 'order.status.stage.changed' | 'order.shipped' | 'order.complete' | 'order.cancelled';
  orderId: string;
  timestamp: string;
  data: {
    stage: string;
    shipments?: Array<{
      carrier: string;
      tracking: { url: string; number: string };
      dispatchDate: string;
    }>;
  };
}
```

**Webhook signature verification:**
```typescript
function verifyProdigiWebhook(body: string, signature: string): boolean {
  const hmac = crypto.createHmac('sha256', PRODIGI_WEBHOOK_SECRET);
  hmac.update(body);
  const expected = hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
```

### 2.6 Prototype Toggle

The `ENABLE_PRINT_FULFILLMENT` environment variable controls whether real Prodigi API calls are made:

```typescript
if (process.env.ENABLE_PRINT_FULFILLMENT === 'true') {
  // Real API call to Prodigi
  const order = await prodigiClient.createOrder(orderRequest);
  return { prodigiOrderId: order.id, status: 'submitted' };
} else {
  // Simulated response
  return {
    prodigiOrderId: `SIM-${crypto.randomUUID().slice(0, 8)}`,
    status: 'simulated',
  };
}
```

In sandbox mode, Prodigi simulates the full order lifecycle (status changes, webhooks) without actually printing anything.

---

## 3. Cloudflare R2 — Photo Storage

### 3.1 Overview

R2 is Cloudflare's S3-compatible object storage with **zero egress fees**. This is critical for a photo app: users viewing their photos generates massive read traffic.

### 3.2 Bucket Configuration

```
Bucket: roll-photos-{env}     (roll-photos-dev, roll-photos-prod)
Region: Automatic (Cloudflare picks the closest)
Access: Private (all access via presigned URLs or service account)
```

**Public access exception:** Thumbnails directory is served via a Cloudflare Worker with a public URL for CDN caching. Original and processed photos are always private.

### 3.3 Object Lifecycle

| Action | R2 Key | When |
|---|---|---|
| Upload original | `originals/{user_id}/{content_hash}.{ext}` | On photo upload |
| Generate thumbnail | `thumbnails/{user_id}/{content_hash}_thumb.webp` | On upload completion |
| Store processed | `processed/{user_id}/{roll_id}/{position}_{profile}.jpg` | On roll development |
| Copy to circle | `circle/{circle_id}/{post_id}/{position}.jpg` | On share to circle |
| Delete all user data | All keys matching `*/{user_id}/*` | On account deletion |

### 3.4 CORS Configuration

```json
{
  "AllowedOrigins": ["https://roll.photos", "http://localhost:3000"],
  "AllowedMethods": ["GET", "PUT", "HEAD"],
  "AllowedHeaders": ["Content-Type", "Content-Length", "x-amz-content-sha256"],
  "MaxAgeSeconds": 3600
}
```

### 3.5 Thumbnail CDN

Thumbnails are served via a public URL with CDN caching for optimal grid loading performance:

```
Public URL pattern: https://photos.roll.photos/thumbnails/{user_id}/{hash}_thumb.webp
CDN cache: 30 days (content-hash URLs are immutable)
Headers: Cache-Control: public, max-age=2592000, immutable
```

---

## 4. Resend — Transactional Email

### 4.1 Overview

Resend handles all transactional email: magic links, order confirmations, roll developed notifications, circle invites.

### 4.2 API Details

```
Base URL: https://api.resend.com
Auth: Authorization: Bearer {RESEND_API_KEY}
From: Roll <noreply@roll.photos>
```

### 4.3 Email Templates

**Magic Link:**
```typescript
{
  from: 'Roll <noreply@roll.photos>',
  to: userEmail,
  subject: 'Sign in to Roll',
  html: magicLinkTemplate({ url: magicLinkUrl }),
  // Template: minimal, warm cream background, ROLL logotype,
  // "Click to sign in" button (terracotta), expires in 1 hour note
}
```

**Roll Developed:**
```typescript
{
  from: 'Roll <noreply@roll.photos>',
  to: userEmail,
  subject: 'Your roll is developed ✓',
  html: rollDevelopedTemplate({
    rollName: 'February 12–18',
    filmProfile: 'Warmth',
    photoCount: 36,
    previewUrls: [url1, url2, url3, url4], // 4 preview thumbnails
  }),
  // Template: 2×2 photo grid preview, "View Your Roll" CTA button
}
```

**Print Order Shipped:**
```typescript
{
  from: 'Roll <noreply@roll.photos>',
  to: userEmail,
  subject: 'Your prints are on the way',
  html: printShippedTemplate({
    rollName: 'February 12–18',
    trackingUrl: 'https://track.prodigi.com/...',
    estimatedDelivery: '3–5 business days',
  }),
}
```

**Circle Invite:**
```typescript
{
  from: 'Roll <noreply@roll.photos>',
  to: inviteeEmail,
  subject: `${inviterName} invited you to ${circleName}`,
  html: circleInviteTemplate({
    inviterName,
    circleName,
    inviteUrl: `https://roll.photos/circle/join/${token}`,
  }),
}
```

### 4.4 Email Design

All email templates follow Roll's design language:
- Background: `#FAF7F2` (warm cream)
- Text: `#1A1612` (warm near-black)
- CTA button: `#C45D3E` (terracotta) with white text
- Font: system fonts (email-safe) — Arial for body, Georgia for headings
- Max width: 600px centered
- No images except photo previews and ROLL logotype
- Unsubscribe link in footer (for non-transactional emails, post-prototype)

---

## 5. Integration Error Handling Summary

| Service | Failure Mode | User Impact | Recovery |
|---|---|---|---|
| eyeQ down | Color correction fails | Roll develops without correction (LUT-only) | User can re-develop later |
| eyeQ slow (>10s/photo) | Roll processing slow | Estimated time updates in real-time | Timeout at 30s/photo, skip correction |
| Prodigi order fails | Prints not ordered | "Order pending" status, retry queued | Auto-retry 3× over 24 hours |
| Prodigi webhook fails | Status not updated | User sees stale status | Polling fallback (check every 6 hours) |
| R2 upload fails | Photo not saved | Per-photo error in upload UI | Client-side retry (3 attempts) |
| R2 read fails | Photo not displayed | Broken image placeholder | Retry with fresh signed URL |
| Resend fails | Email not sent | User doesn't receive notification | Log failure, no retry (non-critical) |

---

## 6. API Key Management

| Service | Key Name | Env Variable | Rotation |
|---|---|---|---|
| eyeQ | API Bearer Token | `EYEQ_API_KEY` | Annually or on compromise |
| Prodigi | API Key | `PRODIGI_API_KEY` | Annually or on compromise |
| Prodigi | Webhook Secret | `PRODIGI_WEBHOOK_SECRET` | Annually or on compromise |
| R2 | Access Key ID | `R2_ACCESS_KEY_ID` | On compromise only |
| R2 | Secret Access Key | `R2_SECRET_ACCESS_KEY` | On compromise only |
| Resend | API Key | `RESEND_API_KEY` | Annually or on compromise |

All keys stored as Vercel environment variables. Never committed to git. `.env.local.example` contains placeholder structure only.
