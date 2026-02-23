# Roll Application -- Performance & Scalability Analysis

**Date:** 2026-02-23
**Scope:** Next.js 16 App Router photo roll application, 154 source files, Vercel serverless deployment
**Stack:** React 19, TypeScript 5.9, Supabase, Stripe, Cloudflare R2, Prodigi, PostHog, Sentry, Sharp, Zustand

---

## Executive Summary

This analysis identified **38 performance findings** across the Roll application, including **6 Critical**, **10 High**, **11 Medium**, and **7 Low** severity issues, plus a dedicated **Database Index Gaps** section (findings PERF-19 through PERF-21). The most impactful problems cluster around three areas: (1) the synchronous image processing pipeline that blocks HTTP requests and will hit Vercel's 300-second serverless timeout for large batches, (2) N+1 query patterns in photo reordering and upload completion that produce O(n) sequential database round-trips, and (3) full-table-scan API routes (`/api/memories`, `/api/collections`, `/api/search`) that fetch entire photo libraries into server memory for client-side filtering. Addressing the Critical and High items would yield an estimated 5-15x throughput improvement on core user flows.

---

## Table of Contents

1. [R2 Storage Operations](#1-r2-storage-operations)
2. [Image Processing Pipeline](#2-image-processing-pipeline)
3. [Upload Flow](#3-upload-flow)
4. [Develop Flow](#4-develop-flow)
5. [Database & Query Performance](#5-database--query-performance)
6. [Supabase Client Patterns](#6-supabase-client-patterns)
7. [Zustand Store & Re-render Performance](#7-zustand-store--re-render-performance)
8. [Frontend Performance](#8-frontend-performance)
9. [Vercel Serverless Constraints](#9-vercel-serverless-constraints)
10. [Concurrency & Race Conditions](#10-concurrency--race-conditions)
11. [Caching Opportunities](#11-caching-opportunities)

---

## 1. R2 Storage Operations

### PERF-01: S3Client recreated on every function call (Confirmed from Phase 1)

**Severity:** Critical
**Impact:** ~50-100ms latency added per R2 operation; for a 36-photo upload complete flow, that is 72+ unnecessary TLS handshakes (one for download, one for thumbnail upload per photo). At 500-photo filter batches, hundreds of cold S3 connections.

**File:** `/home/user/roll/roll-app/src/lib/storage/r2.ts`, lines 4-21

```typescript
function getR2Client() {
  // Creates a NEW S3Client on every single call
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}
```

Every exported function (`getPresignedUploadUrl`, `getPresignedDownloadUrl`, `uploadObject`, `deleteObject`, `getObject`) calls `getR2Client()`, producing a fresh client instance. The AWS SDK S3Client maintains an internal HTTP connection pool; creating a new instance discards that pool.

**Recommendation:** Use a module-level singleton with lazy initialization:

```typescript
let _client: S3Client | null = null;

function getR2Client(): S3Client {
  if (_client) return _client;

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('R2 credentials not configured');
  }

  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}
```

### PERF-02: getObject loads entire image into memory as Buffer

**Severity:** Medium
**Impact:** For a 50MB original photo, the entire file is buffered into a `Buffer` via `Buffer.concat(chunks)`. During filter pipeline processing of 5 concurrent photos (concurrency=5 in `runFilterPipeline`), peak memory can reach 250MB+ for originals alone, plus Sharp's internal buffer copies.

**File:** `/home/user/roll/roll-app/src/lib/storage/r2.ts`, lines 77-91

```typescript
export async function getObject(key: string): Promise<Buffer> {
  const client = getR2Client();
  const response = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const chunks: Uint8Array[] = [];
  const stream = response.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);  // Full materialization in memory
}
```

**Recommendation:** For Sharp-based processing, pipe the stream directly rather than buffering:

```typescript
export async function getObjectStream(key: string): Promise<ReadableStream> {
  const client = getR2Client();
  const response = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return response.Body as ReadableStream;
}
```

Sharp accepts streams: `sharp(await getObjectStream(key))`.

---

## 2. Image Processing Pipeline

### PERF-03: Synchronous filter pipeline blocks HTTP request (Confirmed from Phase 1)

**Severity:** Critical
**Impact:** The `/api/process/filter` route processes all photos synchronously within the HTTP request. For a 500-photo batch (MAX_FILES_PER_UPLOAD), at ~2-5 seconds per photo, total processing time = 200-500 seconds. The 300-second Vercel timeout will be exceeded. Even for a 36-photo roll, this takes 72-180 seconds.

**File:** `/home/user/roll/roll-app/src/app/api/process/filter/route.ts`, lines 57-70

```typescript
// Run pipeline — THIS BLOCKS THE ENTIRE HTTP REQUEST
await runFilterPipeline(photos, async (photoId: string, result: FilterResult) => {
  await supabase
    .from('photos')
    .update({ ... })
    .eq('id', photoId);
});
```

**File:** `/home/user/roll/roll-app/src/lib/processing/pipeline.ts`, lines 177-222

The `runFilterPipeline` function processes photos in batches of 5, but all batches run sequentially within the same request. Each photo requires:
- 1 R2 download (~100-500ms)
- 1 Sharp stats computation (~50ms)
- 5 Sharp detection operations (blur, text, faces, scene, phash) (~200-500ms each)
- 1 DB update (~20-50ms)

**Recommendation:** Decouple processing from the HTTP request. Use a background job pattern:

```typescript
// In the API route: just enqueue and return immediately
export async function POST(request: NextRequest) {
  // ... validation ...
  // Return the job ID immediately
  return NextResponse.json({ jobId, status: 'queued' });
}

// Process via a separate cron/webhook trigger, or use Vercel's
// afterResponse pattern to continue processing after response
```

### PERF-04: O(n^2) duplicate detection (Confirmed from Phase 1)

**Severity:** High
**Impact:** `findDuplicates` compares every photo pair. For n=500 visible photos in a batch, this is n*(n-1)/2 = 124,750 `hammingDistance` calls. Each call performs hex-to-binary conversion and character-by-character comparison.

**File:** `/home/user/roll/roll-app/src/lib/processing/duplicateDetection.ts`, lines 47-72

```typescript
export function findDuplicates(photos, threshold = 5): Set<string> {
  const duplicateIds = new Set<string>();
  for (let i = 0; i < photos.length; i++) {
    for (let j = i + 1; j < photos.length; j++) {  // O(n^2) nested loop
      const distance = hammingDistance(photos[i].phash, photos[j].phash);
      // ...
    }
  }
  return duplicateIds;
}
```

**Recommendation:** Use a hash bucketing approach. Since perceptual hashes are 64-bit, bucket by the first 4-8 bits and only compare within buckets. Alternatively, use a BK-tree or VP-tree for sub-linear nearest-neighbor search:

```typescript
// Bucket approach: O(n * b) where b is average bucket size
function findDuplicatesBucketed(photos, threshold = 5): Set<string> {
  const buckets = new Map<string, typeof photos>();
  for (const photo of photos) {
    const prefix = photo.phash.substring(0, 2); // First 8 bits
    if (!buckets.has(prefix)) buckets.set(prefix, []);
    buckets.get(prefix)!.push(photo);
  }
  // Compare only within each bucket and adjacent buckets
  // ...
}
```

### PERF-05: hammingDistance uses expensive hex-to-binary string conversion

**Severity:** Medium
**Impact:** Each `hammingDistance` call converts every hex digit to a 4-char binary string, then compares character by character. This is ~4x slower than using bitwise XOR and popcount.

**File:** `/home/user/roll/roll-app/src/lib/processing/duplicateDetection.ts`, lines 33-45

```typescript
export function hammingDistance(hash1: string, hash2: string): number {
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    const bin1 = parseInt(hash1[i], 16).toString(2).padStart(4, '0');  // String allocation per digit
    const bin2 = parseInt(hash2[i], 16).toString(2).padStart(4, '0');
    for (let j = 0; j < bin1.length; j++) {
      if (bin1[j] !== bin2[j]) distance++;
    }
  }
  return distance;
}
```

**Recommendation:** Use bitwise XOR and popcount:

```typescript
export function hammingDistance(hash1: string, hash2: string): number {
  if (hash1.length !== hash2.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < hash1.length; i++) {
    let xor = parseInt(hash1[i], 16) ^ parseInt(hash2[i], 16);
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}
```

### PERF-06: filterPhoto downloads image + runs 7 separate Sharp operations

**Severity:** High
**Impact:** Each photo processed by `filterPhoto` triggers 7 distinct Sharp pipeline invocations, each of which decodes the full image from the buffer independently. Sharp can chain operations, but here each detection creates a new pipeline from the raw buffer.

**File:** `/home/user/roll/roll-app/src/lib/processing/pipeline.ts`, lines 125-175

```typescript
export async function filterPhoto(photo: PhotoInput): Promise<FilterResult> {
  const imageBuffer = await getObject(photo.storage_key);  // 1. Full download
  const stats = await sharp(imageBuffer).stats();           // 2. Decode + stats
  // ...
  const blurScore = await detectBlur(imageBuffer);           // 3. Decode + grayscale + resize + raw
  const textRatio = await detectTextRegions(imageBuffer);    // 4. Decode + grayscale + resize + raw
  const phash = await computePerceptualHash(imageBuffer);    // 5. Decode + grayscale + resize + raw
  const faceCount = await detectFaces(imageBuffer);          // 6. Decode + resize + raw
  const sceneLabels = await classifyScene(imageBuffer);      // 7. Decode + resize + stats
}
```

**Recommendation:** Decode once, reuse the pipeline. Create a single small resized version for all detection operations:

```typescript
async function filterPhoto(photo: PhotoInput): Promise<FilterResult> {
  const imageBuffer = await getObject(photo.storage_key);

  // Decode once, create reusable resized buffers
  const [stats, smallGray, smallColor] = await Promise.all([
    sharp(imageBuffer).stats(),
    sharp(imageBuffer).grayscale().resize(256, 256, { fit: 'inside' }).raw()
      .toBuffer({ resolveWithObject: true }),
    sharp(imageBuffer).resize(128, 128, { fit: 'inside' }).raw()
      .toBuffer({ resolveWithObject: true }),
  ]);

  // Run all detections on pre-decoded data (no re-decode)
  // ...
}
```

### PERF-07: Zero dimensions breaks screenshot detection (Confirmed from Phase 1)

**Severity:** Medium
**Impact:** `uploadBatch.ts` sends `width: 0, height: 0` for every uploaded photo. In `screenshotDetection.ts`, `shortSide / longSide` produces `0/0 = NaN`, which passes `Math.abs(NaN - expectedRatio) < sr.tolerance` as `false` (NaN comparisons always return false). This means screenshot detection silently fails for all photos -- it never detects screenshots.

**File:** `/home/user/roll/roll-app/src/lib/utils/uploadBatch.ts`, lines 108-110

```typescript
return {
  storageKey: r.storageKey,
  width: 0,   // Always zero -- dimensions never extracted client-side
  height: 0,  // Always zero
  exifData: {},
};
```

**File:** `/home/user/roll/roll-app/src/lib/processing/screenshotDetection.ts`, lines 18-22

```typescript
const { width, height } = metadata;
const portrait = width < height;  // 0 < 0 => false
const shortSide = portrait ? width : height;  // 0
const longSide = portrait ? height : width;   // 0
const ratio = shortSide / longSide;           // 0/0 = NaN
```

**Recommendation:** Either extract dimensions client-side using `createImageBitmap` or `Image()`, or extract them server-side during upload completion using Sharp's `metadata()` call (which is already being done implicitly by `createThumbnail`). Add a guard in `detectScreenshot`:

```typescript
if (width === 0 || height === 0) {
  // Cannot determine -- fall back to metadata from Sharp
  return false;
}
```

---

## 3. Upload Flow

### PERF-08: Double file read in upload batch (Confirmed from Phase 1)

**Severity:** High
**Impact:** Each uploaded file is read twice: once for the PUT upload to R2 (`body: info.file`), and once for SHA-256 hash computation (`r.file.arrayBuffer()`). For a 50MB file, this means 100MB of total I/O per file. With 500 files at ~10MB average, that is 5GB of redundant I/O.

**File:** `/home/user/roll/roll-app/src/lib/utils/uploadBatch.ts`, lines 55-58, 96-101

```typescript
// First read: upload to R2
const response = await fetch(info.uploadUrl, {
  method: 'PUT',
  body: info.file,  // Reads the File blob
});

// Second read: compute hash AFTER upload
const arrayBuffer = await r.file.arrayBuffer();  // Reads the same file again
const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
```

**Recommendation:** Compute the hash before or during upload using a streaming approach, or compute it once and pass it through:

```typescript
async function uploadOne(info: UploadFileInfo): Promise<UploadResult> {
  // Read once, compute hash and upload from the same buffer
  const arrayBuffer = await info.file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const contentHash = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0')).join('');

  // Upload using the already-read buffer
  const response = await fetch(info.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': info.file.type || 'image/jpeg' },
    body: arrayBuffer,
  });

  return { file: info.file, success: true, storageKey: info.storageKey, contentHash };
}
```

### PERF-09: Sequential presigned URL generation in upload/presign route

**Severity:** High
**Impact:** The presign endpoint generates presigned URLs one at a time in a `for` loop. Each `getPresignedUploadUrl` creates a new S3Client (see PERF-01) and makes an SDK call. For 500 files, this takes 500 * ~100ms = ~50 seconds.

**File:** `/home/user/roll/roll-app/src/app/api/upload/presign/route.ts`, lines 44-67

```typescript
const uploads = [];
for (const file of files) {
  // ...validation...
  const { url } = await getPresignedUploadUrl(storageKey, file.contentType);  // Sequential!
  uploads.push({ ... });
}
```

**Recommendation:** Generate presigned URLs in parallel with bounded concurrency:

```typescript
const uploads = await Promise.all(
  files.map(async (file) => {
    const ext = file.filename.split('.').pop()?.toLowerCase() || 'jpg';
    const uuid = randomUUID();
    const storageKey = `originals/${user.id}/${uuid}.${ext}`;
    const { url } = await getPresignedUploadUrl(storageKey, file.contentType);
    return { filename: file.filename, uploadUrl: url, storageKey, expiresAt: ... };
  })
);
```

### PERF-10: Sequential duplicate check + thumbnail generation in upload/complete

**Severity:** Critical
**Impact:** The upload completion route processes each photo sequentially: duplicate check (1 DB query), R2 download of original, thumbnail generation, thumbnail upload, LQIP generation. For 500 photos, this is 500 * (1 query + 1 download + 2 Sharp ops + 1 upload) = potentially 500+ seconds, far exceeding the 30-second timeout configured for upload routes.

**File:** `/home/user/roll/roll-app/src/app/api/upload/complete/route.ts`, lines 60-113

```typescript
for (const photo of photos) {
  // Sequential duplicate check -- N+1 query pattern
  const { data: existing } = await supabase
    .from('photos')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_hash', photo.contentHash)
    .limit(1);

  if (existing && existing.length > 0) { duplicatesSkipped++; continue; }

  // Downloads the entire original from R2 to generate thumbnail
  const originalBuffer = await getObject(photo.storageKey);
  const thumbnailBuffer = await createThumbnail(originalBuffer);
  await uploadObject(thumbKey, thumbnailBuffer, 'image/webp');
  // ...
}
```

**Recommendation:**

1. Batch duplicate check: query all hashes at once with `.in('content_hash', hashes)`.
2. Process thumbnails in parallel with bounded concurrency.
3. Consider generating thumbnails asynchronously (return success immediately, generate thumbnails in a background job).

```typescript
// Batch duplicate check
const hashes = photos.map(p => p.contentHash);
const { data: existingPhotos } = await supabase
  .from('photos')
  .select('content_hash')
  .eq('user_id', user.id)
  .in('content_hash', hashes);
const existingHashes = new Set(existingPhotos?.map(p => p.content_hash) ?? []);

// Parallel thumbnail generation with concurrency limit
const CONCURRENCY = 5;
for (let i = 0; i < newPhotos.length; i += CONCURRENCY) {
  const batch = newPhotos.slice(i, i + CONCURRENCY);
  await Promise.allSettled(batch.map(photo => generateThumbnail(photo)));
}
```

### PERF-11: No EXIF extraction from uploaded photos

**Severity:** Medium
**Impact:** The client-side upload flow sends `exifData: {}` for all photos (line 112 of `uploadBatch.ts`). This means `date_taken`, `latitude`, `longitude`, `camera_make`, and `camera_model` are all NULL for every uploaded photo. These fields are critical for memories, map, collections, search, and screenshot detection.

**File:** `/home/user/roll/roll-app/src/lib/utils/uploadBatch.ts`, lines 108-113

```typescript
return {
  storageKey: r.storageKey,
  contentHash,
  filename: r.file.name,
  width: 0,
  height: 0,
  exifData: {},  // Always empty -- no EXIF extraction
};
```

**Recommendation:** Extract EXIF data server-side during upload completion using Sharp's `metadata()` function, which already provides width, height, and EXIF data, or use a lightweight client-side EXIF parser like `exifr`.

---

## 4. Develop Flow

### PERF-12: Synchronous develop pipeline blocks HTTP request (Confirmed from Phase 1)

**Severity:** Critical
**Impact:** The develop route processes every photo in a roll sequentially within the HTTP response, with a 100ms `delay()` per photo. For a 36-photo roll, that is a minimum of 3.6 seconds just in artificial delays, plus 36 sequential DB updates (update photo) + 36 more DB updates (update counter) = 72 round-trips minimum. Total time: 10-30 seconds per develop request.

**File:** `/home/user/roll/roll-app/src/app/api/process/develop/route.ts`, lines 127-157

```typescript
for (let i = 0; i < rollPhotos.length; i++) {
  const photo = rollPhotos[i];

  // Update each photo individually
  await supabase.from('roll_photos').update({
    processed_storage_key: processedKey,
    correction_applied: true,
  }).eq('id', photo.id);

  // Update the counter for EVERY single photo
  await supabase.from('rolls').update({ photos_processed: i + 1 }).eq('id', rollId);

  await delay(100);  // Artificial 100ms delay per photo
}
```

**Recommendation:**

1. Remove the artificial `delay(100)` -- it serves no purpose in production.
2. Batch the photo updates instead of updating one at a time.
3. Update the counter periodically (every 5-10 photos) instead of every photo.
4. Better: move to an async job pattern with polling (the polling infrastructure already exists in `useRoll.ts`).

### PERF-13: N+1 counter update pattern in develop

**Severity:** High
**Impact:** The `photos_processed` counter on the `rolls` table is updated for every single photo processed. For a 36-photo roll, this is 36 unnecessary UPDATE queries when a single UPDATE at the end would suffice (or periodic updates every N photos for progress reporting).

**File:** `/home/user/roll/roll-app/src/app/api/process/develop/route.ts`, lines 146-153

```typescript
// Update roll photos_processed counter -- FOR EVERY PHOTO
const { error: counterError } = await supabase
  .from('rolls')
  .update({ photos_processed: i + 1 })
  .eq('id', rollId);
```

**Recommendation:** Update progress every 5 photos or at the end:

```typescript
if ((i + 1) % 5 === 0 || i === rollPhotos.length - 1) {
  await supabase.from('rolls')
    .update({ photos_processed: i + 1 })
    .eq('id', rollId);
}
```

---

## 5. Database & Query Performance

### PERF-14: N+1 roll photo reorder -- sequential UPDATEs (Confirmed from Phase 1)

**Severity:** Critical
**Impact:** Both the reorder endpoint and the DELETE photo endpoint update positions one row at a time. For a DELETE of position 1 in a 36-photo roll, 35 sequential UPDATE queries are issued. The reorder endpoint does the same for all photos.

**File:** `/home/user/roll/roll-app/src/app/api/rolls/[id]/photos/route.ts`, lines 173-179

```typescript
// After deleting a photo, reorder ALL subsequent photos one at a time
for (const photo of remainingPhotos) {
  await supabase
    .from('roll_photos')
    .update({ position: photo.position - 1 })
    .eq('id', photo.id);  // One query per photo!
}
```

**File:** `/home/user/roll/roll-app/src/app/api/rolls/[id]/reorder/route.ts`, lines 62-72

```typescript
// Reorder updates EVERY photo individually
for (let i = 0; i < photoIds.length; i++) {
  await supabase
    .from('roll_photos')
    .update({ position: i + 1 })
    .eq('roll_id', rollId)
    .eq('photo_id', photoIds[i]);  // One query per photo!
}
```

**Recommendation:** Use a single SQL statement via Supabase RPC:

```sql
-- Create an RPC function for batch position update
CREATE OR REPLACE FUNCTION reorder_roll_photos(
  p_roll_id UUID,
  p_photo_ids UUID[]
) RETURNS VOID AS $$
BEGIN
  FOR i IN 1..array_length(p_photo_ids, 1) LOOP
    UPDATE roll_photos SET position = i
    WHERE roll_id = p_roll_id AND photo_id = p_photo_ids[i];
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

For the DELETE case, use a single UPDATE with arithmetic:

```sql
UPDATE roll_photos
SET position = position - 1
WHERE roll_id = $1 AND position > $2;
```

### PERF-15: Full table scan in /api/memories (Confirmed from Phase 1)

**Severity:** High
**Impact:** The memories endpoint fetches ALL visible photos with dates for the user, then filters in JavaScript for "on this day" matches. A user with 10,000 photos downloads all 10,000 rows from the database, only to find maybe 5-10 matching photos.

**File:** `/home/user/roll/roll-app/src/app/api/memories/route.ts`, lines 32-39

```typescript
// Fetches ALL photos -- no date filtering at database level
const { data: photos, error: photosError } = await supabase
  .from('photos')
  .select('id, thumbnail_url, date_taken')
  .eq('user_id', user.id)
  .eq('filter_status', 'visible')
  .not('date_taken', 'is', null)
  .order('date_taken', { ascending: false });
  // No .limit()! No date filtering!
```

**Recommendation:** Filter at the database level using date extraction. Supabase supports raw filters:

```typescript
// Use PostgreSQL EXTRACT to filter month and day at the DB level
const { data: photos } = await supabase
  .from('photos')
  .select('id, thumbnail_url, date_taken')
  .eq('user_id', user.id)
  .eq('filter_status', 'visible')
  .not('date_taken', 'is', null)
  .or(`and(date_taken.gte.${yearStart},date_taken.lt.${yearEnd})`)
  // Or use an RPC that extracts month/day
  .limit(100);
```

Better yet, create an RPC function:

```sql
CREATE FUNCTION get_memories(p_user_id UUID, p_month INT, p_day INT)
RETURNS SETOF photos AS $$
  SELECT * FROM photos
  WHERE user_id = p_user_id
    AND filter_status = 'visible'
    AND date_taken IS NOT NULL
    AND EXTRACT(MONTH FROM date_taken) = p_month
    AND ABS(EXTRACT(DAY FROM date_taken) - p_day) <= 1
    AND EXTRACT(YEAR FROM date_taken) < EXTRACT(YEAR FROM now())
  ORDER BY date_taken DESC
  LIMIT 50;
$$ LANGUAGE sql STABLE;
```

### PERF-16: Sequential year-in-review queries (Confirmed from Phase 1)

**Severity:** High
**Impact:** The year-in-review endpoint runs 7-8 independent database queries serially. Each query takes ~20-50ms. Total latency: 140-400ms when all queries could run in parallel for ~50ms total.

**File:** `/home/user/roll/roll-app/src/app/api/year-in-review/route.ts`, lines 33-100

```typescript
// Query 1: photos
const { data: photos, count: photoCount } = await supabase.from('photos')...

// Query 2: rolls (waits for query 1 to finish)
const { count: rollCount } = await supabase.from('rolls')...

// Query 3: film profiles (waits for query 2 to finish)
const { data: filmProfileData } = await supabase.from('rolls')...

// Query 4: prints (waits for query 3)
const { count: printCount } = await supabase.from('print_orders')...

// Query 5: circles (waits for query 4)
const { count: circleCount } = await supabase.from('circle_members')...

// Query 6: shared posts (waits for query 5)
const { count: sharedCount } = await supabase.from('circle_posts')...

// Query 7: favorites (waits for query 6)
const { count: favCount } = await supabase.from('favorites')...
```

**Recommendation:** Run all independent queries in parallel with `Promise.all`:

```typescript
const [
  { data: photos, count: photoCount },
  { count: rollCount },
  { data: filmProfileData },
  { count: printCount },
  { count: circleCount },
  { count: sharedCount },
  { count: favCount },
] = await Promise.all([
  supabase.from('photos').select('...', { count: 'exact' }).eq('user_id', user.id)...,
  supabase.from('rolls').select('id', { count: 'exact' }).eq('user_id', user.id)...,
  supabase.from('rolls').select('film_profile').eq('user_id', user.id)...,
  supabase.from('print_orders').select('id', { count: 'exact' }).eq('user_id', user.id)...,
  supabase.from('circle_members').select('id', { count: 'exact' }).eq('user_id', user.id)...,
  supabase.from('circle_posts').select('id', { count: 'exact' }).eq('user_id', user.id)...,
  supabase.from('favorites').select('id', { count: 'exact' }).eq('user_id', user.id)...,
]);
```

### PERF-17: /api/search fetches all photos twice

**Severity:** High
**Impact:** The search endpoint runs two queries: (1) the filtered search query with a limit, and (2) a second query fetching ALL visible photos to compute available filter options (scenes and cameras). The second query has no limit and transfers `scene_classification`, `camera_make`, and `camera_model` for every photo.

**File:** `/home/user/roll/roll-app/src/app/api/search/route.ts`, lines 86-102

```typescript
// Second query: fetch ALL photos just to build filter options
const { data: allPhotos } = await supabase
  .from('photos')
  .select('scene_classification, camera_make, camera_model')
  .eq('user_id', user.id)
  .eq('filter_status', 'visible');
// No limit!

// Then iterate through ALL photos to extract unique values
for (const p of allPhotos ?? []) { ... }
```

**Recommendation:** Precompute filter options separately, or use SQL DISTINCT:

```sql
-- Separate cached endpoint for filter options, or use RPC
SELECT DISTINCT unnest(scene_classification) AS scene
FROM photos WHERE user_id = $1 AND filter_status = 'visible';

SELECT DISTINCT CONCAT_WS(' ', camera_make, camera_model) AS camera
FROM photos WHERE user_id = $1 AND filter_status = 'visible'
AND (camera_make IS NOT NULL OR camera_model IS NOT NULL);
```

### PERF-18: /api/collections fetches ALL visible photos without pagination

**Severity:** High
**Impact:** The collections endpoint loads every visible photo for the user to compute smart collections (trips, seasons, cameras, people). This includes `id`, `thumbnail_url`, `date_taken`, `latitude`, `longitude`, `camera_make`, `camera_model`, `face_count`, `scene_classification`, `created_at` -- a wide column selection. For a user with 10,000 photos, this is a massive transfer.

**File:** `/home/user/roll/roll-app/src/app/api/collections/route.ts`, lines 29-34

```typescript
const { data: photos, error: photosError } = await supabase
  .from('photos')
  .select('id, thumbnail_url, date_taken, latitude, longitude, camera_make, camera_model, face_count, scene_classification, created_at')
  .eq('user_id', user.id)
  .eq('filter_status', 'visible')
  .order('date_taken', { ascending: true, nullsFirst: false });
// No limit!
```

**Recommendation:** Compute collections server-side using SQL aggregation rather than loading all rows into the serverless function. Create an RPC or materialized view:

```sql
-- Trip detection via window functions
SELECT date_trunc('day', date_taken) AS trip_day,
       count(*) AS photo_count,
       min(date_taken) AS start_date,
       max(date_taken) AS end_date
FROM photos
WHERE user_id = $1 AND filter_status = 'visible' AND date_taken IS NOT NULL
GROUP BY date_trunc('day', date_taken)
ORDER BY trip_day;
```

### PERF-19: Missing composite index for photo library query

**Severity:** Medium
**Impact:** The most common query in the app (feed page, used by `getVisiblePhotos` and `usePhotos`) filters by `user_id` + `filter_status` and orders by `date_taken DESC, created_at DESC`. While `idx_photos_user_visible` exists as a partial index on `user_id WHERE filter_status = 'visible'`, it does not include `date_taken` or `created_at` in the index, forcing a sort operation.

**File:** `/home/user/roll/roll-app/supabase/migrations/001_create_all_tables.sql`, line 86

```sql
CREATE INDEX IF NOT EXISTS idx_photos_user_visible ON photos(user_id) WHERE filter_status = 'visible';
-- Missing: date_taken and created_at columns in the index for sort elimination
```

While `idx_photos_date_taken` on line 90 exists as `(user_id, date_taken DESC)`, it lacks the `WHERE filter_status = 'visible'` partial predicate and does not include `created_at` -- so the planner cannot use it for the primary feed query which also orders by `created_at`.

**Recommendation:** Replace with a covering index:

```sql
CREATE INDEX IF NOT EXISTS idx_photos_user_visible_sorted
  ON photos(user_id, date_taken DESC NULLS LAST, created_at DESC)
  WHERE filter_status = 'visible';
```

### PERF-20: Missing index on photos for latitude/longitude queries

**Severity:** Low
**Impact:** The `/api/photos/map` endpoint queries photos with non-null latitude and longitude. There is no index that supports this filter, resulting in a sequential scan filtered by the `idx_photos_user_visible` partial index, then a secondary filter for non-null coordinates.

**File:** `/home/user/roll/roll-app/src/app/api/photos/map/route.ts`, lines 26-34

```typescript
const { data: photos, error: photosError } = await supabase
  .from('photos')
  .select('id, thumbnail_url, latitude, longitude, date_taken')
  .eq('user_id', user.id)
  .eq('filter_status', 'visible')
  .not('latitude', 'is', null)
  .not('longitude', 'is', null)
  .order('date_taken', { ascending: false, nullsFirst: false })
  .limit(1000);
```

**Recommendation:**

```sql
CREATE INDEX IF NOT EXISTS idx_photos_user_geotagged
  ON photos(user_id, date_taken DESC)
  WHERE filter_status = 'visible' AND latitude IS NOT NULL AND longitude IS NOT NULL;
```

### PERF-21: Missing index on photos for filename ILIKE search

**Severity:** Low
**Impact:** The search endpoint uses `ilike('filename', '%query%')` which cannot use a B-tree index. For users with thousands of photos, this results in a sequential scan.

**File:** `/home/user/roll/roll-app/src/app/api/search/route.ts`, line 43

```typescript
query = query.ilike('filename', `%${q}%`);
```

**Recommendation:** For production, use a `pg_trgm` GIN index:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_photos_filename_trgm
  ON photos USING gin (filename gin_trgm_ops);
```

---

## 6. Supabase Client Patterns

### PERF-22: Browser Supabase client not singleton (Confirmed from Phase 1)

**Severity:** Medium
**Impact:** `createClient()` in `src/lib/supabase/client.ts` creates a new `BrowserClient` on every call. The hooks `usePhotos`, `useAuth`, `useUser`, and `FeedPage` all call `createClient()` inside callbacks/effects, creating multiple instances per component lifecycle. While `@supabase/ssr`'s `createBrowserClient` may have internal deduplication, this is not guaranteed and produces unnecessary overhead.

**File:** `/home/user/roll/roll-app/src/lib/supabase/client.ts`, lines 1-8

```typescript
export function createClient() {
  return createBrowserClient(   // New instance every call
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

Called in:
- `/home/user/roll/roll-app/src/hooks/usePhotos.ts`, lines 28, 89
- `/home/user/roll/roll-app/src/hooks/useAuth.ts`, lines 20, 38, 57, 78
- `/home/user/roll/roll-app/src/hooks/useUser.ts`, line 12

**Recommendation:** Create a singleton:

```typescript
let _client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (_client) return _client;
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return _client;
}
```

### PERF-23: Duplicate Supabase server client boilerplate in API routes

**Severity:** Low
**Impact:** Several API routes (presign, complete, filter, photos/[id]) manually construct the server client instead of using `createServerSupabaseClient()`. This is not a performance bug per se, but it increases the risk of inconsistency and makes future auth/connection pool changes harder to propagate.

**Files:**
- `/home/user/roll/roll-app/src/app/api/upload/presign/route.ts`, lines 10-24
- `/home/user/roll/roll-app/src/app/api/upload/complete/route.ts`, lines 10-24
- `/home/user/roll/roll-app/src/app/api/process/filter/route.ts`, lines 10-24
- `/home/user/roll/roll-app/src/app/api/photos/[id]/route.ts`, lines 11-25

**Recommendation:** Consistently use `createServerSupabaseClient()` from `@/lib/supabase/server`.

---

## 7. Zustand Store & Re-render Performance

### PERF-24: photoStore.appendPhotos creates new array on every append

**Severity:** Medium
**Impact:** `appendPhotos` uses the spread operator `[...state.photos, ...photos]`, which creates a full copy of the existing array on every infinite scroll load. After 20 pages of 20 photos = 400 photos, each append copies 380-400 existing elements. Any component subscribed to `photos` re-renders on every append.

**File:** `/home/user/roll/roll-app/src/stores/photoStore.ts`, lines 33-34

```typescript
appendPhotos: (photos) =>
  set((state) => ({ photos: [...state.photos, ...photos] })),
```

**Recommendation:** This is inherent to immutable state management. The real optimization is to use Zustand selectors to prevent unnecessary re-renders:

```typescript
// Instead of subscribing to the whole store:
const { photos } = usePhotoStore();

// Use a selector:
const photos = usePhotoStore(state => state.photos);
```

### PERF-25: recoverPhoto re-sorts the entire photo array

**Severity:** Low
**Impact:** When recovering a hidden photo, the entire array is re-sorted. This is O(n log n) for every recover operation.

**File:** `/home/user/roll/roll-app/src/stores/photoStore.ts`, lines 50-55

```typescript
recoverPhoto: (photoId, photo) =>
  set((state) => ({
    photos: [...state.photos, photo].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    ),
  })),
```

**Recommendation:** Use binary insertion to insert the photo at the correct position in O(n):

```typescript
recoverPhoto: (photoId, photo) =>
  set((state) => {
    const photos = [...state.photos];
    const photoTime = new Date(photo.created_at).getTime();
    let insertIdx = photos.findIndex(
      p => new Date(p.created_at).getTime() <= photoTime
    );
    if (insertIdx === -1) insertIdx = photos.length;
    photos.splice(insertIdx, 0, photo);
    return { photos };
  }),
```

### PERF-26: usePhotos hook destructures entire photoStore on every render

**Severity:** Medium
**Impact:** The `usePhotos` hook calls `usePhotoStore()` without a selector, subscribing to every property in the store. Any change to `selectedPhotoIds`, `loading`, `error`, `cursor`, or `hasMore` will re-render all components using `usePhotos`, even if they only need `photos`.

**File:** `/home/user/roll/roll-app/src/hooks/usePhotos.ts`, lines 9-26

```typescript
export function usePhotos(): UsePhotosReturn {
  const {
    photos,
    contentMode,
    loading,
    error,
    cursor,
    hasMore,
    setPhotos,
    appendPhotos,
    // ... 6 more store properties
  } = usePhotoStore();  // Subscribes to EVERYTHING
```

**Recommendation:** Use individual selectors:

```typescript
export function usePhotos(): UsePhotosReturn {
  const photos = usePhotoStore(s => s.photos);
  const contentMode = usePhotoStore(s => s.contentMode);
  const loading = usePhotoStore(s => s.loading);
  // etc.
```

Or use `useShallow` from Zustand for object selectors:

```typescript
import { useShallow } from 'zustand/react/shallow';

const { photos, contentMode, loading } = usePhotoStore(
  useShallow(s => ({ photos: s.photos, contentMode: s.contentMode, loading: s.loading }))
);
```

### PERF-27: FeedPage duplicates useRoll store logic and direct API calls

**Severity:** Medium
**Impact:** `FeedPage` imports `useRollStore` directly AND makes its own API calls for checking/unchecking photos, duplicating the logic already in `useRoll` hook. This creates two separate patterns for roll management that can diverge and cause double API calls.

**File:** `/home/user/roll/roll-app/src/app/(app)/feed/page.tsx`, lines 36, 81-141

The `handleCheck` callback duplicates nearly all of the `useRoll.checkPhoto` and `useRoll.uncheckPhoto` logic, but with subtle differences (e.g., missing optimistic revert in some error paths). This means maintaining two codepaths for the same operation.

**Recommendation:** Use the `useRoll` hook instead of direct store and API access.

### PERF-28: Auto-fill adds photos to roll one at a time sequentially

**Severity:** High
**Impact:** The `handleAutoFill` function in FeedPage adds each suggested photo one at a time in a `for` loop, each requiring a full API round-trip. For 36 photos, this is 36 sequential POST requests.

**File:** `/home/user/roll/roll-app/src/app/(app)/feed/page.tsx`, lines 178-189

```typescript
for (const photoId of suggestedIds) {
  if (isChecked(photoId)) continue;
  checkPhoto(photoId);
  try {
    await fetch(`/api/rolls/${rollId}/photos`, {
      method: 'POST',
      body: JSON.stringify({ photoId }),
    });
  } catch { uncheckPhoto(photoId); }
}
```

**Recommendation:** Create a bulk add endpoint `/api/rolls/[id]/photos/bulk` that accepts an array of photo IDs:

```typescript
// Single API call instead of 36
await fetch(`/api/rolls/${rollId}/photos/bulk`, {
  method: 'POST',
  body: JSON.stringify({ photoIds: suggestedIds }),
});
```

---

## 8. Frontend Performance

### PERF-29: Google Fonts loaded as render-blocking stylesheet

**Severity:** Medium
**Impact:** Three Google Fonts families (Cormorant Garamond, Plus Jakarta Sans, Space Mono) are loaded via a render-blocking `<link>` tag in the root layout. This blocks first contentful paint until all font files are downloaded. The combined CSS + WOFF2 payload is significant (Cormorant Garamond alone has 5 weight variants including italic).

**File:** `/home/user/roll/roll-app/src/app/layout.tsx`, lines 50-55

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link
  href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,700;1,300&family=Plus+Jakarta+Sans:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap"
  rel="stylesheet"
/>
```

**Recommendation:** Use `next/font` for automatic optimization, font subsetting, and self-hosting:

```typescript
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display',
});
```

### PERF-30: PhotoCard has mutable longPressTimer in component body

**Severity:** Low
**Impact:** `longPressTimer` is declared as a `let` variable in the component body (not in a ref), meaning it is re-created on every render and not properly cleaned up across renders. This can cause stale timer references and potential memory leaks on rapid re-renders.

**File:** `/home/user/roll/roll-app/src/components/photo/PhotoCard.tsx`, line 36

```typescript
let longPressTimer: ReturnType<typeof setTimeout> | null = null;
```

**Recommendation:** Use `useRef`:

```typescript
const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

### PERF-31: RollCard injects <style> tag on every instance render

**Severity:** Low
**Impact:** Every `RollCard` instance renders an inline `<style>` tag with the same CSS keyframe animation definition. For a library page with 20 rolls, this injects 20 identical `<style>` tags into the DOM.

**File:** `/home/user/roll/roll-app/src/components/roll/RollCard.tsx`, lines 103-122

```typescript
return (
  <>
    <style>{`
      @keyframes rollcard-dot-pulse { ... }
      .rollcard-pulse { ... }
    `}</style>
    <button>...</button>
  </>
);
```

**Recommendation:** Move the CSS to a global stylesheet or use Tailwind's `@keyframes` configuration.

### PERF-32: No image optimization through Next.js Image component

**Severity:** Medium
**Impact:** All photo thumbnails use raw `<img>` tags rather than Next.js `<Image>` component, missing out on automatic image optimization, format negotiation (WebP/AVIF), responsive srcsets, and lazy loading optimization. While `loading="lazy"` is used, the images are not optimized through Next.js's image pipeline.

**Files:** Multiple components including:
- `/home/user/roll/roll-app/src/components/photo/PhotoCard.tsx`, line 72
- `/home/user/roll/roll-app/src/components/roll/RollCard.tsx`, line 209
- `/home/user/roll/roll-app/src/components/photo/PhotoLightbox.tsx`, line 261

**Recommendation:** Use Next.js `<Image>` component with configured remote patterns (already set up in `next.config.ts`):

```typescript
import Image from 'next/image';

<Image
  src={photo.thumbnail_url}
  alt={...}
  width={400}
  height={533}
  loading="lazy"
  placeholder={photo.lqip_base64 ? 'blur' : 'empty'}
  blurDataURL={photo.lqip_base64 ?? undefined}
/>
```

### PERF-33: lucide-react full icon library may inflate bundle

**Severity:** Low
**Impact:** Multiple components import individual icons from `lucide-react`. While tree-shaking should eliminate unused icons, the total number of unique icon imports across the app (Check, EyeOff, Maximize2, Copy, X, ChevronLeft, ChevronRight, Heart, Upload, Sparkles, Film, Image, AlertCircle, CheckCircle) is moderate. This is generally well-handled by modern bundlers but worth verifying in a production build.

**Recommendation:** Verify bundle size with `@next/bundle-analyzer`. If lucide-react contributes significantly, consider using `lucide-react/icons/[icon-name]` direct imports.

---

## 9. Vercel Serverless Constraints

### PERF-34: Upload complete route will timeout at 30 seconds

**Severity:** Critical
**Impact:** The `vercel.json` configuration sets a 30-second timeout for `src/app/api/upload/**/*.ts`. However, the upload completion route sequentially processes each photo (duplicate check + R2 download + thumbnail generation + R2 upload + LQIP generation). Even 10 photos at ~2-3 seconds each will exceed 30 seconds.

**File:** `/home/user/roll/roll-app/vercel.json`, lines 11-13

```json
"src/app/api/upload/**/*.ts": {
  "maxDuration": 30
}
```

**File:** `/home/user/roll/roll-app/src/app/api/upload/complete/route.ts` -- sequential processing loop

**Recommendation:** Either:
1. Increase the timeout for the complete route (move it to process/* namespace for 300s timeout)
2. Return immediately and process thumbnails asynchronously
3. Generate thumbnails client-side and upload separately

---

## 10. Concurrency & Race Conditions

### PERF-35: Race condition in FeedPage roll creation

**Severity:** Medium
**Impact:** When a user rapidly checks two photos without an existing roll, two `POST /api/rolls` requests may fire simultaneously, creating two rolls. The code checks `currentRoll?.id` before creating, but the second click may execute before the first roll creation completes.

**File:** `/home/user/roll/roll-app/src/app/(app)/feed/page.tsx`, lines 99-117

```typescript
let rollId = currentRoll?.id;
if (!rollId) {
  // Two rapid clicks can both reach here before either completes
  const createRes = await fetch('/api/rolls', { method: 'POST', ... });
  // ...
}
```

**Recommendation:** Use a mutex/lock or a pending creation flag:

```typescript
const creatingRollRef = useRef<Promise<Roll | null> | null>(null);

async function ensureRoll(): Promise<string | null> {
  if (currentRoll?.id) return currentRoll.id;
  if (!creatingRollRef.current) {
    creatingRollRef.current = createRoll().finally(() => {
      creatingRollRef.current = null;
    });
  }
  const roll = await creatingRollRef.current;
  return roll?.id ?? null;
}
```

### PERF-36: No UNIQUE constraint protection for roll_photos position during concurrent updates

**Severity:** Low
**Impact:** While `roll_photos` has `UNIQUE(roll_id, position)`, concurrent photo additions to the same roll can produce duplicate position values if two requests read the count simultaneously and both insert at position N+1.

**File:** `/home/user/roll/roll-app/src/app/api/rolls/[id]/photos/route.ts`, lines 43-63

```typescript
const { count } = await supabase
  .from('roll_photos')
  .select('*', { count: 'exact', head: true })
  .eq('roll_id', rollId);

const nextPosition = count + 1;  // Race: two requests can get same count

const { data: rollPhoto } = await supabase
  .from('roll_photos')
  .insert({ roll_id: rollId, photo_id: photoId, position: nextPosition });
```

**Recommendation:** Use a database sequence or `INSERT ... SELECT COALESCE(MAX(position), 0) + 1`:

```sql
INSERT INTO roll_photos (roll_id, photo_id, position)
VALUES ($1, $2, (SELECT COALESCE(MAX(position), 0) + 1 FROM roll_photos WHERE roll_id = $1));
```

---

## 11. Caching Opportunities

### PERF-37: No caching on frequently-accessed data

**Severity:** Medium
**Impact:** Several read-heavy endpoints have no caching headers or server-side caching:

1. **Film profiles** (`FILM_PROFILE_CONFIGS`): Already a static constant -- good.
2. **User profile**: Fetched on every page load via `useUser` hook.
3. **Rolls list**: Fetched on every visit to feed and library pages.
4. **Search filter options**: Recomputed from all photos on every search request.

**Recommendation:**
- Add `Cache-Control` headers for static/semi-static data.
- Use React 19's `cache()` for request-level deduplication on the server.
- For search filter options, cache them per user with a 5-minute TTL.

### PERF-38: No request deduplication for usePhotos loads

**Severity:** Low
**Impact:** When `setContentMode` is called, it resets the store AND calls `loadPhotos`. But the `useEffect` in the feed page also calls `setContentMode('all')` on mount. This can trigger redundant loads.

**File:** `/home/user/roll/roll-app/src/hooks/usePhotos.ts`, lines 78-81

```typescript
const setContentMode = useCallback((mode: ContentMode) => {
  setStoreContentMode(mode);  // Resets photos, cursor, hasMore
  loadPhotos(mode, false);    // Immediately loads
}, [setStoreContentMode, loadPhotos]);
```

**File:** `/home/user/roll/roll-app/src/app/(app)/feed/page.tsx`, lines 41-43

```typescript
useEffect(() => {
  setContentMode('all');  // Triggers loadPhotos on every mount
}, []);
```

**Recommendation:** Add a `loaded` flag or use `useSWR`/React Query for automatic deduplication and caching.

---

## Summary Table

| ID | Severity | Category | Finding | Est. Impact |
|--------|----------|--------------------------------------|-------------------------------------------------------------|-------------------------------|
| PERF-01 | Critical | R2 Storage | S3Client recreated per call | 50-100ms per R2 op |
| PERF-02 | Medium | R2 Storage | Full image buffered in memory | 250MB+ peak memory |
| PERF-03 | Critical | Processing | Filter pipeline blocks HTTP request | Request timeout at ~60 photos |
| PERF-04 | High | Processing | O(n^2) duplicate detection | 124K comparisons at n=500 |
| PERF-05 | Medium | Processing | Expensive hamming distance impl | ~4x slower than bitwise |
| PERF-06 | High | Processing | 7 separate Sharp decodes per photo | ~3x slower than shared decode |
| PERF-07 | Medium | Processing | Zero dims break screenshot detection | 100% false negatives |
| PERF-08 | High | Upload | Double file read (upload + hash) | 2x I/O per file |
| PERF-09 | High | Upload | Sequential presigned URL generation | ~50s for 500 files |
| PERF-10 | Critical | Upload | Sequential thumbnail gen in complete | Timeout at ~10 photos |
| PERF-11 | Medium | Upload | No EXIF extraction | Missing metadata for features |
| PERF-12 | Critical | Develop | Synchronous develop blocks request | 10-30s for 36 photos |
| PERF-13 | High | Develop | N+1 counter update per photo | 36 extra UPDATEs per roll |
| PERF-14 | Critical | Database | N+1 position UPDATEs on reorder | 35 queries for position 1 delete |
| PERF-15 | High | Database | Full table scan in /api/memories | Loads all user photos |
| PERF-16 | High | Database | Sequential year-in-review queries | 7 serial DB round-trips |
| PERF-17 | High | Database | /api/search fetches all photos twice | 2x transfer, no limit on 2nd |
| PERF-18 | High | Database | /api/collections full table scan | All photos loaded to memory |
| PERF-19 | Medium | Database | Missing composite sort index | Sort not covered by index |
| PERF-20 | Low | Database | No geo-tagged photos index | Seq scan for map queries |
| PERF-21 | Low | Database | No trigram index for filename search | ILIKE causes seq scan |
| PERF-22 | Medium | Supabase | Browser client not singleton | Multiple instances per page |
| PERF-23 | Low | Supabase | Inconsistent server client usage | Maintenance risk |
| PERF-24 | Medium | Zustand | Array copy on every append | O(n) copy per infinite scroll |
| PERF-25 | Low | Zustand | Full sort on photo recovery | O(n log n) per recover |
| PERF-26 | Medium | Zustand | No selectors on usePhotos | Over-rendering |
| PERF-27 | Medium | Frontend | FeedPage duplicates useRoll logic | Double API calls risk |
| PERF-28 | High | Frontend | Auto-fill adds photos sequentially | 36 serial API calls |
| PERF-29 | Medium | Frontend | Render-blocking Google Fonts | Delayed FCP |
| PERF-30 | Low | Frontend | Mutable timer in component body | Potential stale refs |
| PERF-31 | Low | Frontend | RollCard injects <style> per instance | DOM bloat |
| PERF-32 | Medium | Frontend | No Next.js Image optimization | No format negotiation |
| PERF-33 | Low | Frontend | lucide-react bundle impact | Potential bundle bloat |
| PERF-34 | Critical | Serverless | Upload complete timeout at 30s | Fails for >10 photos |
| PERF-35 | Medium | Concurrency | Race in roll creation on rapid clicks | Duplicate rolls |
| PERF-36 | Low | Concurrency | Position race on concurrent adds | UNIQUE violation |
| PERF-37 | Medium | Caching | No caching on read-heavy endpoints | Redundant DB queries |
| PERF-38 | Low | Caching | No request deduplication on load | Double-loading on mount |

---

## Prioritized Remediation Plan

### Phase 1: Critical (Do first -- production reliability)
1. **PERF-01**: Singleton S3Client (30-minute fix, massive impact)
2. **PERF-34 + PERF-10**: Fix upload complete timeout (move to async processing)
3. **PERF-03**: Decouple filter pipeline from HTTP request (async job pattern)
4. **PERF-12**: Decouple develop from HTTP request (already has polling infra)
5. **PERF-14**: Batch reorder UPDATEs (single SQL statement via RPC)

### Phase 2: High (Do next -- user-facing performance)
6. **PERF-16**: Parallelize year-in-review queries (Promise.all)
7. **PERF-08**: Eliminate double file read in upload
8. **PERF-09**: Parallelize presigned URL generation
9. **PERF-15**: Push memories filtering to database
10. **PERF-17**: Eliminate second full-table query in search
11. **PERF-18**: Push collection computation to database
12. **PERF-28**: Create bulk photo add endpoint
13. **PERF-04**: Optimize duplicate detection algorithm
14. **PERF-06**: Share Sharp decode across detections

### Phase 3: Medium (Polish -- measurable improvements)
15. **PERF-22**: Singleton browser Supabase client
16. **PERF-26**: Add Zustand selectors to usePhotos
17. **PERF-29**: Migrate to next/font
18. **PERF-32**: Use Next.js Image component
19. **PERF-07**: Fix zero dimensions in screenshot detection
20. **PERF-19**: Add composite sort index
