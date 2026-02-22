# Roll — Backend Specification

> API routes, Edge Functions, storage operations, auth flows, and server-side processing for the Next.js web prototype.

---

## 1. API Routes Overview

All API routes live in `src/app/api/`. Every route:
- Validates the Supabase session (reject 401 if missing)
- Returns JSON responses with consistent shape: `{ data?, error?, message? }`
- Uses the `SUPABASE_SERVICE_ROLE_KEY` for admin operations (bypassing RLS) only when explicitly needed
- Logs errors to console (prototype) — structured logging post-prototype

### 1.1 Route Map

```
POST   /api/upload/presign        → Generate presigned R2 upload URLs
POST   /api/upload/complete       → Confirm upload, create photo records, trigger filtering
POST   /api/process/filter        → Run filtering pipeline on a batch of photos
POST   /api/process/develop       → Trigger roll development (eyeQ + LUT + grain)
GET    /api/process/status/[id]   → Check processing status for a roll
POST   /api/eyeq/correct          → Proxy to eyeQ Web API (single photo)
POST   /api/prodigi/order         → Submit print order to Prodigi
POST   /api/prodigi/quote         → Get shipping quote from Prodigi
POST   /api/webhooks/prodigi      → Receive Prodigi order status webhooks
POST   /api/circle/share          → Share photos to a Circle
POST   /api/circle/invite         → Generate Circle invite link
```

---

## 2. Photo Upload Pipeline

### 2.1 Presigned URL Generation (`POST /api/upload/presign`)

**Request:**
```typescript
interface PresignRequest {
  files: Array<{
    filename: string;
    contentType: string; // 'image/jpeg' | 'image/heic' | 'image/png' | 'image/webp'
    sizeBytes: number;
  }>;
}
```

**Validation:**
- Max 500 files per request
- Max file size: 50MB per file
- Allowed content types: `image/jpeg`, `image/heic`, `image/png`, `image/webp`
- User must be authenticated

**Response:**
```typescript
interface PresignResponse {
  uploads: Array<{
    filename: string;
    uploadUrl: string;     // Presigned PUT URL for R2
    storageKey: string;    // The R2 object key: originals/{user_id}/{uuid}.{ext}
    expiresAt: string;     // ISO timestamp, 1 hour from now
  }>;
}
```

**Implementation:**
- Generate a UUID for each file
- Create presigned PUT URL using `@aws-sdk/s3-request-presigner` with R2 credentials
- Presigned URL expires in 1 hour
- The client uploads directly to R2 (bypasses Vercel, no bandwidth cost)

### 2.2 Upload Completion (`POST /api/upload/complete`)

Called by the client after all files have been uploaded to R2.

**Request:**
```typescript
interface UploadCompleteRequest {
  photos: Array<{
    storageKey: string;       // R2 key from presign response
    contentHash: string;      // SHA-256 of file content (for dedup)
    filename: string;
    sizeBytes: number;
    width: number;
    height: number;
    exifData: {
      dateTaken?: string;     // ISO timestamp
      latitude?: number;
      longitude?: number;
      cameraMake?: string;
      cameraModel?: string;
    };
    thumbnailBase64: string;  // Client-generated 20px wide LQIP
  }>;
}
```

**Processing:**
1. Check for duplicate `content_hash` in user's photos → skip duplicates, return count
2. Insert photo records into `photos` table (batch insert)
3. Generate thumbnail (400px WebP) via Sharp and upload to `thumbnails/{user_id}/{hash}_thumb.webp`
4. Queue filtering job: insert into `processing_jobs` table with type `filter`
5. Return created photo IDs and duplicate count

**Response:**
```typescript
interface UploadCompleteResponse {
  created: number;
  duplicatesSkipped: number;
  photoIds: string[];
  filterJobId: string;
}
```

---

## 3. Photo Filtering Pipeline

### 3.1 Filter Trigger (`POST /api/process/filter`)

Processes a batch of newly uploaded photos through the filtering pipeline.

**Request:**
```typescript
interface FilterRequest {
  jobId: string;
  photoIds: string[];
}
```

**Pipeline per photo:**

```typescript
async function filterPhoto(photo: Photo): Promise<FilterResult> {
  const image = sharp(await fetchFromR2(photo.storage_key));
  const metadata = await image.metadata();
  const stats = await image.stats();

  // 1. Screenshot detection
  const isScreenshot = detectScreenshot(metadata, photo.exif_data);

  // 2. Blur detection (Laplacian variance)
  const blurScore = await detectBlur(image);
  const isBlurry = blurScore < BLUR_THRESHOLD; // Threshold: 100

  // 3. Extreme exposure
  const isOverExposed = stats.channels[0].mean > 230;
  const isUnderExposed = stats.channels[0].mean < 25;

  // 4. Document/text detection (high-contrast text region ratio)
  const textRegionRatio = await detectTextRegions(image);
  const isDocument = textRegionRatio > 0.4;

  // 5. Perceptual hash for duplicate detection
  const phash = await computePerceptualHash(image);

  // 6. Face detection (for content modes)
  const faceCount = await detectFaces(image); // Sharp + basic haar cascade or TF.js

  // 7. Scene classification
  const sceneLabels = await classifyScene(image); // Basic: indoor/outdoor/landscape/portrait

  // 8. Aesthetic score (composite)
  const aestheticScore = computeAestheticScore({
    blurScore, stats, faceCount, metadata
  });

  return {
    filter_status: (isScreenshot || isBlurry || isOverExposed || isUnderExposed || isDocument)
      ? 'filtered_auto'
      : 'visible',
    filter_reason: isScreenshot ? 'screenshot' : isBlurry ? 'blur' : /* etc */ null,
    aesthetic_score: aestheticScore,
    face_count: faceCount,
    scene_classification: sceneLabels,
    phash: phash,
  };
}
```

**Duplicate collapsing:** After all photos in the batch are hashed, compare pHash hamming distances. If distance < 5, keep the photo with the highest `aesthetic_score` and filter the rest with reason `duplicate`.

**Performance:** Target 100 photos in < 30 seconds. Process in parallel (Promise.allSettled with concurrency limit of 5).

### 3.2 Filter Thresholds

| Detection | Threshold | Notes |
|---|---|---|
| Blur (Laplacian variance) | < 100 | Tuned for phone photos. May need adjustment. |
| Screenshot (no EXIF camera) | Dimension ratio 9:16 or 9:19.5 + no camera make | Common phone screenshot ratios |
| Over-exposure | Mean pixel value > 230 | Nearly blown-out white |
| Under-exposure | Mean pixel value < 25 | Nearly black |
| Document | Text region > 40% | High contrast text blocks |
| Duplicate (pHash distance) | < 5 | Very similar images |

---

## 4. Roll Development Pipeline

### 4.1 Development Trigger (`POST /api/process/develop`)

**Request:**
```typescript
interface DevelopRequest {
  rollId: string;
  filmProfileId: string; // 'warmth' | 'golden' | 'vivid' | 'classic' | 'gentle' | 'modern'
}
```

**Validation:**
- Roll belongs to authenticated user
- Roll status is `ready` (has 10–36 photos)
- Film profile is valid and available for user's tier (free users: warmth only)

**Processing flow:**
1. Set roll status → `processing`
2. For each photo in the roll (ordered by position):
   a. Fetch original from R2
   b. Resize to max 4000px long edge (Sharp)
   c. Call eyeQ API for color correction (see API_INTEGRATIONS.md)
   d. Apply film LUT (.cube file via Sharp)
   e. Composite grain texture overlay
   f. Apply vignette effect
   g. Encode as progressive JPEG (quality: 92)
   h. Upload to R2: `processed/{user_id}/{roll_id}/{position}_{profile}.jpg`
   i. Update `roll_photos` record with `processed_storage_key`
   j. Update roll progress (for realtime subscription)
3. Set roll status → `developed`
4. Send notification (push + email via Resend)

**Error handling:**
- If eyeQ fails for a photo: apply LUT without color correction (fallback). Mark photo as `correction_skipped`.
- If any photo fails entirely: mark as `processing_error`, continue with remaining photos. Roll still develops.
- If > 50% of photos fail: set roll status to `error`, notify user, allow retry.

### 4.2 LUT Application (Sharp)

```typescript
async function applyFilmProfile(
  imageBuffer: Buffer,
  profile: FilmProfile
): Promise<Buffer> {
  let pipeline = sharp(imageBuffer);

  // 1. Exposure bias (per-profile brightness/contrast adjustment)
  pipeline = pipeline.modulate({
    brightness: profile.exposureBias.brightness,  // e.g., 1.05
    saturation: profile.exposureBias.saturation,  // e.g., 1.1
  });

  // 2. Apply LUT
  // Sharp doesn't natively support .cube LUTs — use a custom implementation:
  // Parse .cube file → create 3D lookup table → apply per-pixel color mapping
  const lutBuffer = await applyLUT(await pipeline.toBuffer(), profile.lutPath);

  // 3. Grain composite
  pipeline = sharp(lutBuffer).composite([{
    input: profile.grainTexturePath,
    blend: 'overlay',
    opacity: profile.grainOpacity,  // e.g., 0.08 for Warmth, 0.15 for Classic
    tile: true,
  }]);

  // 4. Vignette (radial gradient darken)
  const { width, height } = await sharp(lutBuffer).metadata();
  const vignetteMask = generateVignetteMask(width!, height!, profile.vignetteIntensity);
  pipeline = pipeline.composite([{
    input: vignetteMask,
    blend: 'multiply',
  }]);

  // 5. Encode
  return pipeline.jpeg({ quality: 92, progressive: true }).toBuffer();
}
```

### 4.3 Film Profile Configurations

```typescript
const FILM_PROFILES: Record<string, FilmProfile> = {
  warmth: {
    lutPath: 'public/luts/warmth.cube',
    grainTexturePath: 'public/grain/warmth_grain.webp',
    grainOpacity: 0.06,
    vignetteIntensity: 0.15,
    exposureBias: { brightness: 1.05, saturation: 1.1 },
    type: 'color',
  },
  golden: {
    lutPath: 'public/luts/golden.cube',
    grainTexturePath: 'public/grain/golden_grain.webp',
    grainOpacity: 0.08,
    vignetteIntensity: 0.20,
    exposureBias: { brightness: 1.08, saturation: 1.15 },
    type: 'color',
  },
  vivid: {
    lutPath: 'public/luts/vivid.cube',
    grainTexturePath: 'public/grain/vivid_grain.webp',
    grainOpacity: 0.04,
    vignetteIntensity: 0.10,
    exposureBias: { brightness: 1.02, saturation: 1.3 },
    type: 'color',
  },
  classic: {
    lutPath: 'public/luts/classic.cube',
    grainTexturePath: 'public/grain/classic_grain.webp',
    grainOpacity: 0.15,
    vignetteIntensity: 0.25,
    exposureBias: { brightness: 0.95, saturation: 0 },
    type: 'bw',
  },
  gentle: {
    lutPath: 'public/luts/gentle.cube',
    grainTexturePath: 'public/grain/gentle_grain.webp',
    grainOpacity: 0.08,
    vignetteIntensity: 0.12,
    exposureBias: { brightness: 1.1, saturation: 0 },
    type: 'bw',
  },
  modern: {
    lutPath: 'public/luts/modern.cube',
    grainTexturePath: 'public/grain/modern_grain.webp',
    grainOpacity: 0.03,
    vignetteIntensity: 0.08,
    exposureBias: { brightness: 1.0, saturation: 0 },
    type: 'bw',
  },
};
```

---

## 5. Print Ordering

### 5.1 Order Submission (`POST /api/prodigi/order`)

**Request:**
```typescript
interface PrintOrderRequest {
  rollId: string;
  product: 'roll_prints' | 'album_prints' | 'individual';
  photoIds?: string[];          // For individual prints
  printSize: '4x6' | '5x7';    // 5x7 requires Roll+
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string; // ISO 3166-1 alpha-2
  };
  isFreeFirstRoll?: boolean;
}
```

**Processing:**
1. Validate roll is developed and belongs to user
2. Generate signed R2 URLs for each photo (24-hour expiry)
3. If `ENABLE_PRINT_FULFILLMENT=true`:
   - POST to Prodigi `/v4.0/orders` (see API_INTEGRATIONS.md)
   - Store order in `print_orders` table
4. If `ENABLE_PRINT_FULFILLMENT=false`:
   - Simulate order creation with mock Prodigi response
   - Store order in `print_orders` with `status: 'simulated'`
5. Send order confirmation email via Resend

### 5.2 Prodigi Webhook Handler (`POST /api/webhooks/prodigi`)

**Validation:**
- Verify webhook signature using `X-Prodigi-Signature` header
- Reject if signature doesn't match

**Events handled:**
| Event | Action |
|---|---|
| `order.status.stage.changed` | Update `print_orders.status` |
| `order.shipped` | Update status, store tracking URL, send email |
| `order.complete` | Update status, send "Your prints arrived!" email |
| `order.cancelled` | Update status, send notification email |

---

## 6. Circle (Sharing) Backend

### 6.1 Share to Circle (`POST /api/circle/share`)

**Request:**
```typescript
interface ShareRequest {
  circleId: string;
  photoIds: string[]; // Must be from developed rolls (Favorites preferred)
}
```

**Processing:**
1. Validate user is member of circle and has Roll+ tier
2. Validate all photos are developed and belong to user
3. Copy processed photos to `circle/{circle_id}/{post_id}/` in R2 (isolation copy)
4. Create `circle_posts` record
5. Create `circle_post_photos` records
6. Trigger Realtime update for circle members

### 6.2 Generate Invite (`POST /api/circle/invite`)

**Request:**
```typescript
interface InviteRequest {
  circleId: string;
}
```

**Response:**
```typescript
interface InviteResponse {
  inviteUrl: string;   // https://roll.photos/circle/join/{token}
  expiresAt: string;   // 7 days from now
}
```

- Token: 32-character random hex string
- Stored in `circle_invites` table with expiry
- One-time use: consumed on acceptance

---

## 7. Supabase Edge Functions

### 7.1 `process-roll`

Long-running processing function triggered by roll development request. Runs outside Vercel's serverless timeout constraints.

**Trigger:** HTTP POST from `/api/process/develop` or directly via Supabase function URL.

**Capabilities:**
- Access to R2 via S3 SDK
- Access to eyeQ API
- Sharp for image processing (bundled or via Deno FFI)
- Supabase client for database updates + Realtime pushes

**Note for prototype:** If Sharp isn't available in Deno Edge Functions, fall back to Vercel serverless function with increased timeout (Vercel Pro: 300s). The Edge Function architecture is the production target.

### 7.2 `send-notification`

Sends transactional emails via Resend.

**Trigger:** Database webhook on specific status changes.

**Email templates:**
| Trigger | Subject | Content |
|---|---|---|
| Roll developed | "Your roll is developed ✓" | Preview of 4 photos, CTA to view roll |
| Print order shipped | "Your prints are on the way" | Tracking URL, estimated delivery |
| Circle invite | "You're invited to [Circle Name]" | Inviter name, CTA to join |
| Magic link | "Sign in to Roll" | Magic link button |

### 7.3 `prodigi-webhook`

Receives and processes Prodigi webhook events. Mirrors the Vercel API route but deployed as an Edge Function for the production architecture.

---

## 8. Storage Operations (Cloudflare R2)

### 8.1 R2 Client Configuration

```typescript
// src/lib/storage/r2.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});
```

### 8.2 Key Operations

```typescript
// Generate presigned upload URL (1 hour)
async function getUploadUrl(key: string, contentType: string): Promise<string>

// Generate presigned read URL (1 hour for display, 24 hours for Prodigi)
async function getReadUrl(key: string, expiresIn?: number): Promise<string>

// Upload processed image
async function uploadProcessed(key: string, buffer: Buffer): Promise<void>

// Delete photo (when user deletes account)
async function deletePhoto(key: string): Promise<void>

// Copy photo to circle storage
async function copyToCircle(sourceKey: string, circleKey: string): Promise<void>
```

### 8.3 URL Patterns

| Type | Pattern | Access |
|---|---|---|
| Original | `originals/{user_id}/{content_hash}.{ext}` | Private (signed URLs) |
| Thumbnail | `thumbnails/{user_id}/{content_hash}_thumb.webp` | Public CDN |
| Processed | `processed/{user_id}/{roll_id}/{position}_{profile}.jpg` | Private (signed URLs) |
| Circle | `circle/{circle_id}/{post_id}/{position}.jpg` | Private (signed, scoped to members) |

---

## 9. Rate Limiting

### 9.1 Per-Route Limits

| Route | Limit | Window | Notes |
|---|---|---|---|
| `/api/upload/presign` | 10 requests | 1 minute | Max 500 files per request |
| `/api/process/develop` | 5 requests | 1 hour | Expensive (eyeQ costs) |
| `/api/prodigi/order` | 3 requests | 1 hour | Prevent accidental duplicate orders |
| `/api/circle/invite` | 10 requests | 1 hour | Prevent invite spam |
| All other routes | 60 requests | 1 minute | General protection |

### 9.2 Implementation

Use Vercel's built-in rate limiting or a simple in-memory counter (prototype). Production: Upstash Redis.

```typescript
// Simple prototype rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}
```

---

## 10. Background Jobs

### 10.1 Job Queue (Prototype)

For the prototype, use a simple Supabase-backed job queue:

```sql
CREATE TABLE processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,          -- 'filter' | 'develop' | 'generate_thumbnail'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'processing' | 'completed' | 'failed'
  payload JSONB NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  attempts INT DEFAULT 0,
  max_attempts INT DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

**Processing:** API routes pick up pending jobs. Cron function (Supabase scheduled function) retries failed jobs every 5 minutes.

### 10.2 Cron Functions

| Function | Schedule | Purpose |
|---|---|---|
| `retry-failed-jobs` | Every 5 min | Retry failed processing jobs (up to 3 attempts) |
| `cleanup-expired-invites` | Daily midnight | Delete expired circle invites |
| `cleanup-orphaned-uploads` | Daily 3 AM | Delete R2 objects with no matching photo record (abandoned uploads) |

---

## 11. Anti-Patterns

Things Claude Code must **never** do in the backend:

1. **Never use the service role key in client-side code.** Service role bypasses RLS. Server-side only.
2. **Never store photo files in Supabase Storage.** Photos go to R2. Supabase stores metadata only.
3. **Never return raw database errors to the client.** Wrap in user-friendly error messages.
4. **Never trust client-provided user_id.** Always derive from the authenticated session.
5. **Never process photos synchronously in the API response.** Always queue and return immediately.
6. **Never store presigned URLs in the database.** They expire. Generate fresh ones on each request.
7. **Never send emails without checking user notification preferences.**
8. **Never hardcode API keys or secrets.** Always use environment variables.
9. **Never skip webhook signature verification.** Unverified webhooks are a security hole.
10. **Never delete original photos from R2.** Processed versions are additive. Originals are sacred.
