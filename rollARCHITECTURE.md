# Roll — Architecture

> System architecture for the Next.js web prototype.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                      │
│                                                         │
│   Next.js App Router (React 19, TypeScript, Tailwind)   │
│   ├── Feed (filtered photos, content modes, checkmarks) │
│   ├── Library (developed rolls, favorites)              │
│   ├── Circle (private sharing feed)                     │
│   └── Account (settings, subscription, print history)   │
│                                                         │
│   State: Zustand (photo selection, roll building)       │
│   Auth: Supabase client-side session                    │
└─────────────┬───────────────────────────┬───────────────┘
              │                           │
              ▼                           ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│   Vercel Edge / SSR     │   │   Supabase                │
│                         │   │                           │
│   API Routes:           │   │   ├── Auth (email/magic)  │
│   ├── /api/process      │   │   ├── PostgreSQL + RLS    │
│   ├── /api/eyeq         │   │   ├── Edge Functions      │
│   ├── /api/prodigi      │   │   │   ├── process-roll    │
│   └── /api/webhooks/*   │   │   │   ├── prodigi-webhook │
│                         │   │   │   └── notify           │
│   Server Components     │   │   ├── Realtime (status)   │
│   for data fetching     │   │   └── Storage (metadata)  │
└─────────┬───────────────┘   └───────────┬───────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────┐   ┌───────────────────────────┐
│   Cloudflare R2         │   │   External APIs           │
│                         │   │                           │
│   Photo Storage:        │   │   ├── eyeQ Web API        │
│   ├── originals/        │   │   │   (color correction)  │
│   ├── processed/        │   │   ├── Prodigi API         │
│   └── thumbnails/       │   │   │   (print fulfillment) │
│                         │   │   └── Resend              │
│   S3-compatible         │   │       (transactional email)│
│   Zero egress fees      │   │                           │
└─────────────────────────┘   └───────────────────────────┘
```

---

## 2. Data Flow: Upload → Filter → Checkmark → Develop → Print

### 2.1 Photo Upload Flow

```
User selects photos (file picker / drag-and-drop)
  │
  ├── Client: validate file types, check for exact duplicates (content hash)
  ├── Client: generate thumbnails for immediate display (canvas resize)
  ├── Client: extract EXIF metadata (date, GPS, camera)
  │
  ▼
Upload to Cloudflare R2 (presigned URL from API route)
  │
  ├── Original stored in: originals/{user_id}/{hash}.{ext}
  ├── Thumbnail stored in: thumbnails/{user_id}/{hash}_thumb.webp
  │
  ▼
Create photo record in Supabase `photos` table
  │
  ▼
Trigger filtering pipeline (async)
  │
  ├── Blur detection (Laplacian variance via Sharp)
  ├── Screenshot detection (dimension + EXIF analysis)
  ├── Near-duplicate detection (perceptual hash + hamming distance)
  ├── Extreme exposure detection (histogram analysis)
  ├── Document detection (text region analysis)
  │
  ├── Face detection (for People Only content mode)
  ├── Scene classification (for Landscapes mode)
  │
  ▼
Update photo records: filter_status, face_count, scene_classification
  │
  ▼
Client receives filtered feed via Supabase Realtime or polling
```

### 2.2 Roll Development Flow

```
User fills roll to 36 (or manually closes at 10+)
  │
  ▼
User selects film profile (Warmth, Golden, Vivid, etc.)
  │
  ▼
Roll status → "processing"
  │
  ▼
Supabase Edge Function: process-roll
  │
  For each photo in roll:
  │
  ├── 1. Fetch original from R2
  ├── 2. POST to eyeQ Web API (color correction)
  │      ├── Scene detection
  │      ├── White balance correction
  │      ├── Skin tone accuracy
  │      ├── Exposure normalization
  │      └── Adaptive sharpening
  ├── 3. Apply film LUT (.cube file via Sharp/libvips)
  ├── 4. Composite grain overlay (per-profile texture)
  ├── 5. Apply subtle vignette
  ├── 6. Encode to JPEG (quality: 92)
  ├── 7. Store processed image in R2: processed/{user_id}/{roll_id}/{position}.jpg
  │
  ▼
Roll status → "developed"
  │
  ▼
Push notification / Realtime update: "Your roll is developed."
  │
  ▼
User reviews developed roll → hearts favorites → orders prints
```

### 2.3 Print Order Flow

```
User taps "Order Prints" on a developed roll
  │
  ▼
Select print product (Roll Prints / Album / Individual)
  │
  ▼
Enter or confirm shipping address
  │
  ▼
API route: POST /api/prodigi
  │
  ├── Generate signed R2 URLs for each photo (24-hour expiry)
  ├── POST to Prodigi /v4.0/orders
  │     ├── SKU: GLOBAL-PHO-4x6-GLOSSY or GLOBAL-PHO-5x7-GLOSSY
  │     ├── Image URLs (signed)
  │     └── Shipping address
  ├── Store order in Supabase `print_orders`
  │
  ▼
Prodigi fulfills and ships
  │
  ├── Webhook: POST /api/webhooks/prodigi
  ├── Update print_orders status
  ├── Send email notification via Resend
  │
  ▼
User receives prints (3–5 business days)
```

---

## 3. Processing Architecture

### 3.1 Photo Filtering Pipeline

The filtering pipeline runs server-side after each upload batch. Two execution options:

**Option A: Vercel Serverless Function (prototype)**
- Process photos in `/api/process` route
- Default 60s execution time on Vercel Pro (extended to 300s for `/api/process/**` routes via vercel.json — see rollDEPLOYMENT.md)
- Good for batches up to ~50 photos
- Use for prototype validation

**Option B: Supabase Edge Function (production-ready)**
- Triggered by database insert trigger on `photos` table
- No execution time limit concern for individual photo processing
- Better for background processing at scale
- Preferred for launch

**Pipeline steps (per photo):**

```typescript
interface FilterResult {
  filter_status: 'visible' | 'filtered_auto';
  filter_reason: string | null;  // 'blur' | 'screenshot' | 'duplicate' | 'exposure' | 'document'
  aesthetic_score: number;       // 0–1 composite quality score
  face_count: number;
  scene_classification: string[];
  phash: string;                 // Perceptual hash for duplicate detection
}
```

### 3.2 Film Profile Processing

Each film profile consists of:

1. **`.cube` LUT file** (33×33×33 color lookup table) — the primary color transform
2. **Grain texture** — unique per profile, varying in intensity and character
3. **Vignette settings** — subtle edge darkening, varying by profile
4. **Exposure bias** — slight per-profile adjustment before LUT application

Processing via Sharp (Node.js):

```
Original JPEG
  → Resize to max 4000px long edge (preserve aspect ratio)
  → Apply eyeQ correction (API call)
  → Apply exposure bias (per-profile brightness/contrast tweak)
  → Apply LUT color transform (Sharp cube LUT or manual color mapping)
  → Composite grain texture (per-profile overlay at profile-specific opacity)
  → Apply vignette (radial gradient darken, profile-specific radius + intensity)
  → Encode JPEG (quality: 92, progressive)
  → Store to R2
```

### 3.3 eyeQ Integration Architecture

```
Roll Edge Function
  │
  ├── For each photo:
  │     POST https://api.perfectlyclear.com/v3/correct
  │     Headers: Authorization: Bearer {EYEQ_API_KEY}
  │     Body: {
  │       image_url: signed_r2_url,
  │       preset: "roll_standard",   // Custom preset from eyeQ Workbench
  │       output_format: "jpeg",
  │       output_quality: 95
  │     }
  │     Response: { corrected_url: "https://..." }
  │
  ├── Download corrected image
  ├── Apply LUT + grain + vignette via Sharp
  ├── Upload final processed image to R2
  │
  ▼
  Update roll_photos.processed_storage_url
```

**Fallback (if eyeQ is unavailable):** skip color correction, apply LUT directly to original. Log the failure. User can re-develop the roll later.

---

## 4. Storage Architecture

### 4.1 Cloudflare R2 (Photo Files)

```
roll-photos-{env}/
├── originals/
│   └── {user_id}/
│       └── {content_hash}.{ext}      # Original uploads (HEIC→JPEG converted)
├── processed/
│   └── {user_id}/
│       └── {roll_id}/
│           └── {position}_{profile}.jpg  # Processed with film profile
├── thumbnails/
│   └── {user_id}/
│       └── {content_hash}_thumb.webp  # 400px wide thumbnails for grid
└── circle/
    └── {circle_id}/
        └── {post_id}/
            └── {position}.jpg         # Shared photos (copies for isolation)
```

**Access pattern:**
- Thumbnails: public with CDN caching (grid display performance)
- Originals: private, signed URLs (1-hour expiry)
- Processed: private, signed URLs (1-hour display, 24-hour for Prodigi)
- Circle: private, signed URLs scoped to circle membership

### 4.2 Supabase (Metadata + Auth)

Supabase stores:
- All relational data (users, photos, rolls, roll_photos, circles, print_orders)
- Auth sessions and user accounts
- Row Level Security policies for data isolation
- Realtime subscriptions for processing status updates

Supabase does NOT store:
- Photo files (those go to R2)
- Large binary data

---

## 5. Authentication Architecture

```
User visits Roll
  │
  ├── New user: Enter email → Supabase sends magic link → Click link → Session created
  ├── Returning user: Enter email + password → Session created
  ├── Magic link: Click email link → Supabase verifies → Redirect to /feed
  │
  ▼
Supabase session stored in httpOnly cookie (via @supabase/ssr)
  │
  ├── Server Components: createServerClient() reads cookie
  ├── Client Components: createBrowserClient() reads cookie
  ├── API Routes: createRouteHandlerClient() reads cookie
  ├── Middleware: verify session on every request, redirect if expired
  │
  ▼
Session refresh: automatic via Supabase client (token refresh before expiry)
```

**Auth callback route:** `/auth/callback` handles magic link redirect, exchanges code for session, redirects to `/feed` or `/onboarding` (first visit).

---

## 6. Realtime Architecture

Supabase Realtime is used for:

1. **Roll processing status:** client subscribes to `rolls` table changes for the user's rolls. When `status` changes from `processing` → `developed`, show the "Your roll is developed" celebration.

2. **Photo filtering status:** after upload, client subscribes to `photos` table changes. As each photo's `filter_status` is set, the filtered feed updates live.

3. **Circle feed updates:** members subscribed to `circle_posts` for their circles. New posts appear without page refresh.

```typescript
// Example: subscribe to roll processing status
supabase
  .channel('roll-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'rolls',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    if (payload.new.status === 'developed') {
      showCelebration(payload.new.id);
    }
  })
  .subscribe();
```

---

## 7. Caching Strategy

| Data | Cache Location | TTL | Invalidation |
|---|---|---|---|
| Thumbnail URLs | CDN (R2 public bucket) | 30 days | Content-hash-based URLs (immutable) |
| Filtered feed | Client (Zustand) + SWR | Session | On upload, on filter change, on manual hide |
| Developed roll photos | CDN via signed URL | 1 hour | New signed URL on expiry |
| Film profile previews | Browser cache | 7 days | Version-stamped filenames |
| User session | httpOnly cookie | 7 days | Supabase auto-refresh |

---

## 8. Error Handling Strategy

| Failure | Impact | Handling |
|---|---|---|
| eyeQ API down | Can't develop rolls | Queue for retry. Show "Processing delayed" status. Allow developing without correction (LUT-only fallback). |
| R2 upload failure | Photos not saved | Client-side retry (3 attempts, exponential backoff). Show per-photo error state. |
| Prodigi API failure | Can't order prints | Queue order for retry. Show "Order pending" status. Email user when resolved. |
| Supabase down | App non-functional | Show maintenance page. Supabase has 99.9% SLA. |
| Filter pipeline crash | Some photos unfiltered | Mark photos as `filter_status = 'pending'`. Retry on next pipeline run. |

---

## 9. Performance Requirements

| Metric | Target |
|---|---|
| Upload speed | 10 photos in <15 seconds (parallel upload to R2) |
| Filter pipeline | 100 photos in <30 seconds |
| Feed load (500 photos) | <2 seconds with virtualized grid |
| Roll development (36 photos) | <2 minutes total |
| Film preview swap | <200ms (client-side CSS/Canvas filter) |
| Photo grid scroll | 60fps with lazy loading |
| Time to interactive | <3 seconds on 4G connection |

---

## 10. Environment Configuration

```bash
# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Cloudflare R2
R2_ACCOUNT_ID=xxxxx
R2_ACCESS_KEY_ID=xxxxx
R2_SECRET_ACCESS_KEY=xxxxx
R2_BUCKET_NAME=roll-photos-dev
R2_PUBLIC_URL=https://photos.roll.photos

# eyeQ / Perfectly Clear
EYEQ_API_KEY=xxxxx
EYEQ_API_URL=https://api.perfectlyclear.com/v3
EYEQ_PRESET=roll_standard

# Prodigi
PRODIGI_API_KEY=xxxxx
PRODIGI_API_URL=https://api.sandbox.prodigi.com  # Use sandbox for prototype
ENABLE_PRINT_FULFILLMENT=false  # Toggle real API calls

# Resend (transactional email)
RESEND_API_KEY=xxxxx

# App
NEXT_PUBLIC_APP_URL=https://roll.photos
NEXT_PUBLIC_APP_NAME=Roll
```
