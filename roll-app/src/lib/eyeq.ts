/**
 * EyeQ / Perfectly Clear WebAPI v2 client.
 *
 * Async flow:
 * 1. GET /upload           → presigned URL + fileKey
 * 2. PUT <presigned URL>   → upload file bytes
 * 3. GET /pfc?fileKey=...  → start correction job → statusEndpoint
 * 4. GET /status/{jobID}   → poll until COMPLETED (302) or FAILED
 * 5. Download corrected file from correctedFile URL
 *
 * Docs: https://perfectlyclear.io/docs/
 */

const EYEQ_BASE_URL = 'https://api.perfectlyclear.io/v2';

/** Maximum time to wait for a single correction job (ms). */
const EYEQ_POLL_TIMEOUT_MS = 120_000;

/** Interval between status polls (ms). */
const EYEQ_POLL_INTERVAL_MS = 1_500;

/** Maximum retries for transient network errors. */
const EYEQ_MAX_RETRIES = 3;

export type EyeQPreset = string;

export interface EyeQCorrectionOptions {
  /** Named preset uploaded via Workbench / presets API. */
  preset?: EyeQPreset;
  /** Resize: output width in pixels (aspect ratio preserved). */
  width?: number;
  /** Resize: output height in pixels (aspect ratio preserved). */
  height?: number;
  /** Resize: longest edge in pixels. */
  long?: number;
  /** Resize: shortest edge in pixels. */
  short?: number;
  /** Resize: percentage scale (e.g. 200 = 2×). */
  scale?: number;
  /** Upscale method. */
  resize?: 'auto' | 'general' | 'smallDetails';
  /** Enable background removal. */
  removeBG?: boolean;
  /** Enable glasses glare removal. */
  removeGlare?: boolean;
  /** Output type override (jpeg, png). */
  outputType?: string;
}

export type EyeQJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';

interface UploadResponse {
  fileKey: string;
  upload_url: string;
}

interface CorrectionResponse {
  statusEndpoint: string;
}

interface StatusResponse {
  status: EyeQJobStatus;
  _id: string;
  statusText: string;
  correctedFile?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EyeQResult {
  /** URL to download the corrected file (valid ~24 h). */
  correctedFileUrl: string;
  /** Job ID for reference. */
  jobId: string;
}

function getApiKey(): string {
  const key = process.env.EYEQ_API_KEY;
  if (!key) throw new Error('EYEQ_API_KEY environment variable is not set');
  return key;
}

/**
 * Whether EyeQ is configured and available.
 * When false, callers should fall back to local-only processing.
 */
export function isEyeQEnabled(): boolean {
  return !!process.env.EYEQ_API_KEY;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = EYEQ_MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, init);
      return res;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastError ?? new Error('fetchWithRetry exhausted');
}

// ── Step 1: Get presigned upload URL ─────────────────────────────────

async function getUploadUrl(): Promise<UploadResponse> {
  const res = await fetchWithRetry(`${EYEQ_BASE_URL}/upload`, {
    method: 'GET',
    headers: { 'X-API-KEY': getApiKey() },
  });
  if (!res.ok) {
    throw new Error(`EyeQ /upload failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as UploadResponse;
}

// ── Step 2: Upload file bytes ────────────────────────────────────────

async function uploadFile(
  presignedUrl: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  const res = await fetchWithRetry(presignedUrl, {
    method: 'PUT',
    headers: {
      'X-API-KEY': getApiKey(),
      'Content-Type': contentType,
    },
    body: new Uint8Array(fileBuffer),
  });
  if (!res.ok) {
    throw new Error(`EyeQ PUT upload failed: ${res.status} ${await res.text()}`);
  }
}

// ── Step 3: Start correction job ─────────────────────────────────────

async function startCorrection(
  fileKey: string,
  options: EyeQCorrectionOptions = {}
): Promise<CorrectionResponse> {
  const params = new URLSearchParams({ fileKey });

  if (options.preset) params.set('preset', options.preset);
  if (options.width) params.set('width', String(options.width));
  if (options.height) params.set('height', String(options.height));
  if (options.long) params.set('long', String(options.long));
  if (options.short) params.set('short', String(options.short));
  if (options.scale) params.set('scale', String(options.scale));
  if (options.resize) params.set('resize', options.resize);
  if (options.removeBG) params.set('removeBG', 'true');
  if (options.removeGlare) params.set('removeGlare', 'true');
  if (options.outputType) params.set('outputType', options.outputType);

  const res = await fetchWithRetry(`${EYEQ_BASE_URL}/pfc?${params.toString()}`, {
    method: 'GET',
    headers: { 'X-API-KEY': getApiKey() },
  });
  if (!res.ok) {
    throw new Error(`EyeQ /pfc failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as CorrectionResponse;
}

// ── Step 4: Poll status until done ───────────────────────────────────

async function pollStatus(statusEndpoint: string): Promise<StatusResponse> {
  const deadline = Date.now() + EYEQ_POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetchWithRetry(statusEndpoint, {
      method: 'GET',
      headers: { 'X-API-KEY': getApiKey() },
      redirect: 'manual', // We handle 302 ourselves
    });

    // 302 means COMPLETED — the Location header has the corrected file URL
    if (res.status === 302) {
      const location = res.headers.get('location');
      if (location) {
        return {
          status: 'COMPLETED',
          _id: statusEndpoint.split('/').pop() || '',
          statusText: 'done',
          correctedFile: location,
        };
      }
    }

    if (!res.ok && res.status !== 200) {
      throw new Error(`EyeQ /status error: ${res.status} ${await res.text()}`);
    }

    const body = (await res.json()) as StatusResponse;

    if (body.status === 'COMPLETED') {
      return body;
    }

    if (body.status === 'FAILED' || body.status === 'REJECTED') {
      throw new Error(`EyeQ job ${body.status}: ${body.statusText}`);
    }

    // Still PENDING or PROCESSING — wait and retry
    await new Promise((r) => setTimeout(r, EYEQ_POLL_INTERVAL_MS));
  }

  throw new Error(`EyeQ correction timed out after ${EYEQ_POLL_TIMEOUT_MS}ms`);
}

// ── Step 5: Download corrected file ──────────────────────────────────

async function downloadCorrectedFile(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`EyeQ download failed: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Correct an image through the EyeQ Perfectly Clear WebAPI.
 *
 * Returns the corrected image as a Buffer, or null if EyeQ is not configured.
 */
export async function correctImage(
  imageBuffer: Buffer,
  contentType: string,
  options: EyeQCorrectionOptions = {}
): Promise<{ correctedBuffer: Buffer; jobId: string } | null> {
  if (!isEyeQEnabled()) return null;

  // 1. Get presigned upload URL
  const { fileKey, upload_url } = await getUploadUrl();

  // 2. Upload the file
  await uploadFile(upload_url, imageBuffer, contentType);

  // 3. Start correction
  const { statusEndpoint } = await startCorrection(fileKey, options);

  // 4. Poll until done
  const status = await pollStatus(statusEndpoint);

  if (!status.correctedFile) {
    throw new Error('EyeQ job completed but no correctedFile URL returned');
  }

  // 5. Download corrected file
  const correctedBuffer = await downloadCorrectedFile(status.correctedFile);

  return { correctedBuffer, jobId: status._id };
}

/**
 * Correct a video through the EyeQ Perfectly Clear WebAPI.
 *
 * The v2 API supports MP4 and MOV files up to 5GB.
 * Returns the corrected video as a Buffer, or null if EyeQ is not configured.
 */
export async function correctVideo(
  videoBuffer: Buffer,
  contentType: string,
  options: EyeQCorrectionOptions = {}
): Promise<{ correctedBuffer: Buffer; jobId: string } | null> {
  if (!isEyeQEnabled()) return null;

  // Same flow as images — the v2 API handles both
  const { fileKey, upload_url } = await getUploadUrl();
  await uploadFile(upload_url, videoBuffer, contentType);
  const { statusEndpoint } = await startCorrection(fileKey, options);
  const status = await pollStatus(statusEndpoint);

  if (!status.correctedFile) {
    throw new Error('EyeQ video job completed but no correctedFile URL returned');
  }

  const correctedBuffer = await downloadCorrectedFile(status.correctedFile);
  return { correctedBuffer, jobId: status._id };
}

/**
 * List all presets available on this EyeQ account.
 */
export async function listPresets(): Promise<Array<{ presetId: string; name: string }>> {
  if (!isEyeQEnabled()) return [];

  const res = await fetchWithRetry(`${EYEQ_BASE_URL}/presets`, {
    method: 'GET',
    headers: { 'X-API-KEY': getApiKey() },
  });
  if (!res.ok) {
    throw new Error(`EyeQ /presets failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as Array<{ presetId: string; name: string }>;
}
