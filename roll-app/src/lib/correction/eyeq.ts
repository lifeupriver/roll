/**
 * EyeQ / Perfectly Clear WebAPI v2 provider.
 *
 * Async flow:
 * 1. GET /upload           → presigned URL + fileKey
 * 2. PUT <presigned URL>   → upload file bytes
 * 3. GET /pfc?fileKey=...  → start correction job → statusEndpoint
 * 4. GET /status/{jobID}   → poll until COMPLETED (302) or FAILED
 * 5. Download corrected file from correctedFile URL
 *
 * Supports both images and video (MP4/MOV up to 5 GB).
 */

import type { CorrectionProvider, CorrectionResult } from './types';

const BASE_URL = 'https://api.perfectlyclear.io/v2';
const POLL_TIMEOUT_MS = 120_000;
const POLL_INTERVAL_MS = 1_500;
const MAX_RETRIES = 3;

interface UploadResponse {
  fileKey: string;
  upload_url: string;
}

interface StatusResponse {
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REJECTED';
  _id: string;
  statusText: string;
  correctedFile?: string;
}

function getApiKey(): string {
  const key = process.env.EYEQ_API_KEY;
  if (!key) throw new Error('EYEQ_API_KEY environment variable is not set');
  return key;
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      }
    }
  }
  throw lastError ?? new Error('fetchWithRetry exhausted');
}

async function getUploadUrl(): Promise<UploadResponse> {
  const res = await fetchWithRetry(`${BASE_URL}/upload`, {
    method: 'GET',
    headers: { 'X-API-KEY': getApiKey() },
  });
  if (!res.ok) throw new Error(`EyeQ /upload failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as UploadResponse;
}

async function uploadFile(
  presignedUrl: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  const res = await fetchWithRetry(presignedUrl, {
    method: 'PUT',
    headers: { 'X-API-KEY': getApiKey(), 'Content-Type': contentType },
    body: new Uint8Array(fileBuffer),
  });
  if (!res.ok) throw new Error(`EyeQ PUT upload failed: ${res.status} ${await res.text()}`);
}

async function startCorrection(fileKey: string): Promise<string> {
  const params = new URLSearchParams({ fileKey });
  const preset = process.env.EYEQ_PRESET;
  if (preset) params.set('preset', preset);

  const res = await fetchWithRetry(`${BASE_URL}/pfc?${params.toString()}`, {
    method: 'GET',
    headers: { 'X-API-KEY': getApiKey() },
  });
  if (!res.ok) throw new Error(`EyeQ /pfc failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { statusEndpoint: string };
  return body.statusEndpoint;
}

async function pollStatus(statusEndpoint: string): Promise<StatusResponse> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetchWithRetry(statusEndpoint, {
      method: 'GET',
      headers: { 'X-API-KEY': getApiKey() },
      redirect: 'manual',
    });

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
    if (body.status === 'COMPLETED') return body;
    if (body.status === 'FAILED' || body.status === 'REJECTED') {
      throw new Error(`EyeQ job ${body.status}: ${body.statusText}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`EyeQ correction timed out after ${POLL_TIMEOUT_MS}ms`);
}

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url, { method: 'GET' });
  if (!res.ok) throw new Error(`EyeQ download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

async function correctFile(fileBuffer: Buffer, contentType: string): Promise<CorrectionResult> {
  const { fileKey, upload_url } = await getUploadUrl();
  await uploadFile(upload_url, fileBuffer, contentType);
  const statusEndpoint = await startCorrection(fileKey);
  const status = await pollStatus(statusEndpoint);

  if (!status.correctedFile) {
    throw new Error('EyeQ job completed but no correctedFile URL returned');
  }

  const correctedBuffer = await downloadFile(status.correctedFile);
  return { correctedBuffer, jobId: status._id, provider: 'eyeq' };
}

// ── Provider ─────────────────────────────────────────────────────────

export const eyeqProvider: CorrectionProvider = {
  name: 'eyeq',

  isEnabled() {
    return !!process.env.EYEQ_API_KEY;
  },

  supportsVideo() {
    return true;
  },

  async correctImage(imageBuffer, contentType) {
    if (!this.isEnabled()) return null;
    return correctFile(imageBuffer, contentType);
  },

  async correctVideo(videoBuffer, contentType) {
    if (!this.isEnabled()) return null;
    return correctFile(videoBuffer, contentType);
  },
};
