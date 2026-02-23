import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock dependencies
const mockGetUser = vi.fn();
const mockFrom = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock('@/lib/processing/sharp', () => ({
  createThumbnail: vi.fn().mockResolvedValue(Buffer.from('thumb')),
  generateLqip: vi.fn().mockResolvedValue('data:image/webp;base64,abc'),
}));

vi.mock('@/lib/storage/r2', () => ({
  uploadObject: vi.fn().mockResolvedValue(undefined),
  getObject: vi.fn().mockResolvedValue(Buffer.from('image-data')),
  getThumbnailUrl: vi.fn().mockReturnValue('https://cdn.example.com/thumb.webp'),
  getThumbnailKey: vi.fn().mockReturnValue('thumbs/user-123/abc.webp'),
}));

import { POST } from '@/app/api/upload/complete/route';

const VALID_USER_ID = 'user-abc-123';

function makePhoto(storageKey: string) {
  return {
    storageKey,
    contentHash: 'hash-abc',
    filename: 'photo.jpg',
    contentType: 'image/jpeg',
    sizeBytes: 1024,
    width: 800,
    height: 600,
    exifData: {},
  };
}

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/upload/complete', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/upload/complete — IDOR prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: VALID_USER_ID } },
      error: null,
    });
  });

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await POST(makeRequest({ photos: [] }));
    expect(res.status).toBe(401);
  });

  it('rejects storage keys belonging to another user', async () => {
    const photos = [makePhoto('originals/OTHER-USER-ID/malicious.jpg')];
    const res = await POST(makeRequest({ photos }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('does not match authenticated user');
  });

  it('path traversal key still passes prefix check (string-level)', async () => {
    // This key starts with the valid prefix at the string level, so it passes
    // the startsWith check. The traversal is handled at the storage layer.
    const photos = [makePhoto(`originals/${VALID_USER_ID}/../other-user/photo.jpg`)];

    // Mock DB calls for the happy path since prefix check passes
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'photos') {
        return { select: mockSelect, insert: mockInsert };
      }
      if (table === 'processing_jobs') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ photos }));
    // The string prefix check passes because the key starts with `originals/<userId>/`
    // R2/S3 does not resolve `..` in object keys, so this is not a real traversal risk
    expect(res.status).toBe(200);
  });

  it('rejects empty storage keys', async () => {
    const photos = [{ ...makePhoto(''), storageKey: '' }];
    const res = await POST(makeRequest({ photos }));
    // Zod validation catches empty strings (400) before the IDOR check (403)
    expect([400, 403]).toContain(res.status);
  });

  it('rejects storage keys without the originals prefix', async () => {
    const photos = [makePhoto('thumbnails/user-abc-123/photo.jpg')];
    const res = await POST(makeRequest({ photos }));
    expect(res.status).toBe(403);
  });

  it('accepts valid storage keys for authenticated user', async () => {
    const validKey = `originals/${VALID_USER_ID}/photo.jpg`;
    const photos = [makePhoto(validKey)];

    // Mock the DB calls for the happy path
    const mockSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    });
    const mockInsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === 'photos') {
        return { select: mockSelect, insert: mockInsert };
      }
      if (table === 'processing_jobs') {
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { id: 'job-1' }, error: null }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ photos }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.created).toBe(1);
  });

  it('returns 400 when photos array is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});
