/**
 * Imagen AI REST API v1 provider.
 *
 * Project-based workflow:
 * 1. POST /projects/                                → create project
 * 2. POST /projects/{uuid}/get_temporary_upload_links → presigned S3 URLs
 * 3. PUT  <presigned URL>                           → upload file bytes
 * 4. POST /projects/{uuid}/edit                     → start editing
 * 5. GET  /projects/{uuid}/edit/status              → poll until done
 * 6. POST /projects/{uuid}/export                   → start JPEG export
 * 7. GET  /projects/{uuid}/export/status            → poll until done
 * 8. GET  /projects/{uuid}/export/get_temporary_download_links → download URLs
 * 9. Download corrected JPEG
 *
 * Notes:
 *   - Imagen returns XMP sidecars by default; we use the export flow to get JPEGs
 *   - Profile key trained on ~3K edited photos defines the editing "style"
 *   - Images only (no video support)
 *   - One file per project for our use case (single-image correction)
 *
 * Docs: https://github.com/imagenai/imagen-ai-sdk
 */

import type { CorrectionProvider, CorrectionResult } from './types';

const BASE_URL = 'https://api-beta.imagen-ai.com/v1';
const USER_AGENT = 'Roll-App/1.0';
const POLL_TIMEOUT_MS = 300_000; // 5 min — Imagen edits can take longer
const POLL_INTERVAL_MS = 5_000; // 5 s between polls (Imagen recommends 10-60s)
const MAX_RETRIES = 3;

interface StatusDetails {
  status: string;
  progress?: number;
  details?: string;
}

interface PresignedUrl {
  file_name: string;
  upload_link: string;
}

interface DownloadLink {
  file_name: string;
  download_link: string;
}

function getApiKey(): string {
  const key = process.env.IMAGEN_API_KEY;
  if (!key) throw new Error('IMAGEN_API_KEY environment variable is not set');
  return key;
}

function getProfileKey(): number {
  const key = process.env.IMAGEN_PROFILE_KEY;
  if (!key) throw new Error('IMAGEN_PROFILE_KEY environment variable is not set');
  return parseInt(key, 10);
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'x-api-key': getApiKey(),
    'User-Agent': USER_AGENT,
    ...extra,
  };
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

// ── Step 1: Create project ───────────────────────────────────────────

async function createProject(): Promise<string> {
  const res = await fetchWithRetry(`${BASE_URL}/projects/`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ name: `roll-correction-${Date.now()}` }),
  });
  if (!res.ok) throw new Error(`Imagen create project failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: { project_uuid: string } };
  return body.data.project_uuid;
}

// ── Step 2: Get upload URL ───────────────────────────────────────────

async function getUploadLinks(projectUuid: string, fileNames: string[]): Promise<PresignedUrl[]> {
  const res = await fetchWithRetry(
    `${BASE_URL}/projects/${projectUuid}/get_temporary_upload_links`,
    {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ file_names: fileNames }),
    }
  );
  if (!res.ok) throw new Error(`Imagen get upload links failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: PresignedUrl[] };
  return body.data;
}

// ── Step 3: Upload file ──────────────────────────────────────────────

async function uploadToS3(
  presignedUrl: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  const res = await fetchWithRetry(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body: new Uint8Array(fileBuffer),
  });
  if (!res.ok) throw new Error(`Imagen S3 upload failed: ${res.status}`);
}

// ── Step 4: Start editing ────────────────────────────────────────────

async function startEditing(projectUuid: string): Promise<void> {
  const profileKey = getProfileKey();
  const photographyType = process.env.IMAGEN_PHOTOGRAPHY_TYPE || undefined;

  const body: Record<string, unknown> = { profile_key: profileKey };
  if (photographyType) body.photography_type = photographyType;

  // Imagen requires an empty-ish Content-Type for the edit endpoint
  const res = await fetchWithRetry(`${BASE_URL}/projects/${projectUuid}/edit`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Imagen start editing failed: ${res.status} ${await res.text()}`);
}

// ── Step 5: Poll edit status ─────────────────────────────────────────

async function pollEditStatus(projectUuid: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetchWithRetry(`${BASE_URL}/projects/${projectUuid}/edit/status`, {
      method: 'GET',
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Imagen edit status failed: ${res.status} ${await res.text()}`);

    const body = (await res.json()) as { data: StatusDetails };
    const { status } = body.data;

    if (status === 'done' || status === 'completed') return;
    if (status === 'failed' || status === 'error') {
      throw new Error(`Imagen editing failed: ${body.data.details || status}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Imagen editing timed out after ${POLL_TIMEOUT_MS}ms`);
}

// ── Step 6: Start export ─────────────────────────────────────────────

async function startExport(projectUuid: string): Promise<void> {
  const res = await fetchWithRetry(`${BASE_URL}/projects/${projectUuid}/export`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Imagen start export failed: ${res.status} ${await res.text()}`);
}

// ── Step 7: Poll export status ───────────────────────────────────────

async function pollExportStatus(projectUuid: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const res = await fetchWithRetry(`${BASE_URL}/projects/${projectUuid}/export/status`, {
      method: 'GET',
      headers: headers(),
    });
    if (!res.ok) throw new Error(`Imagen export status failed: ${res.status} ${await res.text()}`);

    const body = (await res.json()) as { data: StatusDetails };
    const { status } = body.data;

    if (status === 'done' || status === 'completed') return;
    if (status === 'failed' || status === 'error') {
      throw new Error(`Imagen export failed: ${body.data.details || status}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error(`Imagen export timed out after ${POLL_TIMEOUT_MS}ms`);
}

// ── Step 8: Get download links ───────────────────────────────────────

async function getExportDownloadLinks(projectUuid: string): Promise<DownloadLink[]> {
  const res = await fetchWithRetry(
    `${BASE_URL}/projects/${projectUuid}/export/get_temporary_download_links`,
    { method: 'GET', headers: headers() }
  );
  if (!res.ok) throw new Error(`Imagen download links failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { data: DownloadLink[] };
  return body.data;
}

// ── Step 9: Download file ────────────────────────────────────────────

async function downloadFile(url: string): Promise<Buffer> {
  const res = await fetchWithRetry(url, { method: 'GET' });
  if (!res.ok) throw new Error(`Imagen download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// ── Full correction flow ─────────────────────────────────────────────

function extensionFromContentType(contentType: string): string {
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('heic') || contentType.includes('heif')) return 'heic';
  return 'jpg';
}

async function correctImageFile(
  imageBuffer: Buffer,
  contentType: string
): Promise<CorrectionResult> {
  const ext = extensionFromContentType(contentType);
  const fileName = `photo.${ext}`;

  // 1. Create project
  const projectUuid = await createProject();

  // 2-3. Get upload link and upload
  const [uploadLink] = await getUploadLinks(projectUuid, [fileName]);
  if (!uploadLink) throw new Error('Imagen returned no upload link');
  await uploadToS3(uploadLink.upload_link, imageBuffer, contentType);

  // 4-5. Start editing and wait
  await startEditing(projectUuid);
  await pollEditStatus(projectUuid);

  // 6-7. Export to JPEG and wait
  await startExport(projectUuid);
  await pollExportStatus(projectUuid);

  // 8-9. Download corrected JPEG
  const downloadLinks = await getExportDownloadLinks(projectUuid);
  if (!downloadLinks.length) throw new Error('Imagen returned no download links');

  const correctedBuffer = await downloadFile(downloadLinks[0].download_link);
  return { correctedBuffer, jobId: projectUuid, provider: 'imagen' };
}

// ── Provider ─────────────────────────────────────────────────────────

export const imagenProvider: CorrectionProvider = {
  name: 'imagen',

  isEnabled() {
    return !!process.env.IMAGEN_API_KEY && !!process.env.IMAGEN_PROFILE_KEY;
  },

  supportsVideo() {
    // Imagen AI currently supports images only
    return false;
  },

  async correctImage(imageBuffer, contentType) {
    if (!this.isEnabled()) return null;
    return correctImageFile(imageBuffer, contentType);
  },

  async correctVideo() {
    // Imagen does not support video correction
    return null;
  },
};
