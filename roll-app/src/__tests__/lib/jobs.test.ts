import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase service client
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockSelect = vi.fn();
const _mockEq = vi.fn();
const _mockSingle = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: mockInsert,
      update: mockUpdate,
      select: mockSelect,
    })),
    rpc: undefined,
  })),
}));

vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
}));

import { registerProcessor, enqueueJob, dispatchJob } from '@/lib/jobs';

describe('jobs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
  });

  describe('registerProcessor', () => {
    it('registers a processor without error', () => {
      expect(() => registerProcessor('test-type', async () => {})).not.toThrow();
    });
  });

  describe('enqueueJob', () => {
    it('inserts a job row and returns the id', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: 'job-123' }, error: null }),
        }),
      });

      const jobId = await enqueueJob('user-1', 'filter', { photoIds: ['p1'] });
      expect(jobId).toBe('job-123');
    });

    it('throws when insert fails', async () => {
      mockInsert.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
        }),
      });

      await expect(enqueueJob('user-1', 'filter', {})).rejects.toThrow('Failed to enqueue job');
    });

    it('throws when Supabase env vars are missing', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      await expect(enqueueJob('user-1', 'filter', {})).rejects.toThrow(
        'Missing Supabase service role configuration'
      );
    });
  });

  describe('dispatchJob', () => {
    it('silently returns when job cannot be claimed', async () => {
      mockUpdate.mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
            }),
          }),
        }),
      });

      // Should not throw
      await expect(dispatchJob('nonexistent-id')).resolves.toBeUndefined();
    });

    it('marks job as failed when no processor is registered', async () => {
      // First call: claim update (returns the job)
      mockUpdate.mockReturnValueOnce({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: {
                  id: 'job-1',
                  type: 'unregistered-type',
                  status: 'running',
                  payload: {},
                },
                error: null,
              }),
            }),
          }),
        }),
      });
      // Second call: failure update
      mockUpdate.mockReturnValueOnce({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });

      await dispatchJob('job-1');
      expect(mockUpdate).toHaveBeenCalledTimes(2);
    });
  });
});
