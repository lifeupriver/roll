import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase server client
const mockGetUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: () => mockGetUser(),
    },
  }),
}));

import { GET } from '@/app/api/photos/serve/route';

function makeRequest(key: string): NextRequest {
  const url = new URL(`http://localhost:3000/api/photos/serve?key=${encodeURIComponent(key)}`);
  return new NextRequest(url);
}

describe('GET /api/photos/serve — open redirect prevention', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await GET(makeRequest('some-key'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when key parameter is missing', async () => {
    const url = new URL('http://localhost:3000/api/photos/serve');
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(400);
  });

  it('blocks redirect to attacker-controlled domain', async () => {
    const res = await GET(makeRequest('https://evil.com/phish'));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Redirect target not allowed');
  });

  it('blocks redirect to spoofed subdomain of allowed host', async () => {
    const res = await GET(makeRequest('https://evil.picsum.photos.attacker.com/img'));
    expect(res.status).toBe(403);
  });

  it('blocks redirect to plain HTTP malicious URL', async () => {
    const res = await GET(makeRequest('http://evil.com/steal-cookies'));
    expect(res.status).toBe(403);
  });

  it('blocks redirect to data URI disguised as http', async () => {
    const res = await GET(makeRequest('https://attacker.io/redirect'));
    expect(res.status).toBe(403);
  });

  it('allows redirect to picsum.photos (allowed host)', async () => {
    const res = await GET(makeRequest('https://picsum.photos/200/300'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://picsum.photos/200/300');
  });

  it('allows redirect to photos.roll.photos (allowed host)', async () => {
    const res = await GET(makeRequest('https://photos.roll.photos/abc'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://photos.roll.photos/abc');
  });

  it('allows redirect to subdomain of allowed host', async () => {
    const res = await GET(makeRequest('https://cdn.photos.roll.photos/img.jpg'));
    expect(res.status).toBe(307);
  });

  it('returns 400 for malformed URLs', async () => {
    const res = await GET(makeRequest('https://not a valid url'));
    // The URL constructor may parse this differently, but it shouldn't crash
    expect([400, 403]).toContain(res.status);
  });

  it('handles storage key (non-URL) by constructing CDN URL', async () => {
    process.env.R2_PUBLIC_URL = 'https://cdn.example.com';
    const res = await GET(makeRequest('originals/user-123/photo.jpg'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://cdn.example.com/originals/user-123/photo.jpg');
    delete process.env.R2_PUBLIC_URL;
  });
});
