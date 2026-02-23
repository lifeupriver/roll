import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the createClient from supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        limit: vi.fn(() => Promise.resolve({ data: [{ id: '123' }], error: null })),
      })),
    })),
  })),
}));

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
    vi.stubEnv('R2_ACCOUNT_ID', 'test-r2-account');
    vi.stubEnv('R2_ACCESS_KEY_ID', 'test-r2-key');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', 'test-r2-secret');
  });

  it('returns healthy when all checks pass', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.checks.env.ok).toBe(true);
    expect(body.checks.storage.ok).toBe(true);
    expect(body.timestamp).toBeDefined();
    expect(body.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('returns degraded when R2 is not configured', async () => {
    vi.stubEnv('R2_ACCOUNT_ID', '');
    vi.stubEnv('R2_ACCESS_KEY_ID', '');
    vi.stubEnv('R2_SECRET_ACCESS_KEY', '');

    // Re-import to pick up new env
    vi.resetModules();
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe('degraded');
    expect(body.checks.storage.ok).toBe(false);
  });

  it('includes version and uptime', async () => {
    const { GET } = await import('@/app/api/health/route');
    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeDefined();
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });
});
