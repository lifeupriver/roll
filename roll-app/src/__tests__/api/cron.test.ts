import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockDelete = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => ({
      delete: vi.fn(() => ({
        is: vi.fn(() => ({
          lt: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          lt: vi.fn(() => ({
            order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [], error: null })),
            })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          lt: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
          eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        is: vi.fn(() => ({
          lt: vi.fn(() => ({
            select: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
}));

describe('Cron: cleanup-invites', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.resetModules();
  });

  it('rejects requests without valid cron secret', async () => {
    const { GET } = await import('@/app/api/cron/cleanup-invites/route');
    const request = new NextRequest('http://localhost/api/cron/cleanup-invites', {
      headers: { authorization: 'Bearer wrong-secret' },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it('allows requests with valid cron secret', async () => {
    const { GET } = await import('@/app/api/cron/cleanup-invites/route');
    const request = new NextRequest('http://localhost/api/cron/cleanup-invites', {
      headers: { authorization: 'Bearer test-cron-secret' },
    });
    const response = await GET(request);
    const body = await response.json();
    expect(body.success).toBe(true);
  });
});

describe('Cron: retry-jobs', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.resetModules();
  });

  it('rejects unauthorized requests', async () => {
    const { GET } = await import('@/app/api/cron/retry-jobs/route');
    const request = new NextRequest('http://localhost/api/cron/retry-jobs', {
      headers: { authorization: 'Bearer bad' },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});

describe('Cron: cleanup-orphans', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-key');
    vi.stubEnv('CRON_SECRET', 'test-cron-secret');
    vi.resetModules();
  });

  it('rejects unauthorized requests', async () => {
    const { GET } = await import('@/app/api/cron/cleanup-orphans/route');
    const request = new NextRequest('http://localhost/api/cron/cleanup-orphans', {
      headers: { authorization: 'Bearer bad' },
    });
    const response = await GET(request);
    expect(response.status).toBe(401);
  });
});
