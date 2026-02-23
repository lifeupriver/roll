import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

// Track DB operations
const mockUpdateFn = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockSelectFn = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'print_orders') {
        return {
          select: (...args: unknown[]) => {
            mockSelectFn(...args);
            return {
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: 'internal-order-123' },
                  error: null,
                }),
              }),
            };
          },
          update: (...args: unknown[]) => {
            mockUpdateFn(...args);
            return {
              eq: vi.fn().mockResolvedValue({ error: null }),
            };
          },
        };
      }
      return {};
    }),
  }),
}));

vi.mock('@/lib/prodigi', () => ({
  verifyWebhookSignature: vi.fn().mockImplementation((body: string, signature: string) => {
    const secret = process.env.PRODIGI_WEBHOOK_SECRET || 'test-secret';
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature;
  }),
}));

vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
}));

import { POST } from '@/app/api/webhooks/prodigi/route';

const WEBHOOK_SECRET = 'test-secret';

function signPayload(body: string): string {
  return createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex');
}

function makeWebhookRequest(payload: unknown, signature?: string): NextRequest {
  const body = JSON.stringify(payload);
  const sig = signature ?? signPayload(body);
  return new NextRequest('http://localhost:3000/api/webhooks/prodigi', {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'X-Prodigi-Signature': sig,
    },
  });
}

describe('POST /api/webhooks/prodigi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    process.env.PRODIGI_WEBHOOK_SECRET = WEBHOOK_SECRET;
  });

  it('rejects requests with missing signature', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/prodigi', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects requests with invalid signature', async () => {
    const payload = { type: 'order.shipped', data: { order: { id: 'prod-123' } } };
    const res = await POST(makeWebhookRequest(payload, 'invalid-signature'));
    expect(res.status).toBe(401);
  });

  it('returns 400 when order ID is missing from payload', async () => {
    const payload = { type: 'order.shipped', data: {} };
    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(400);
  });

  it('handles order.status.stage.changed — InProgress maps to in_production', async () => {
    const payload = {
      type: 'order.status.stage.changed',
      data: {
        order: {
          id: 'prod-123',
          status: { stage: 'InProgress' },
        },
      },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpdateFn).toHaveBeenCalledWith({ status: 'in_production' });
  });

  it('handles order.status.stage.changed — Complete maps to delivered', async () => {
    const payload = {
      type: 'order.status.stage.changed',
      data: {
        order: {
          id: 'prod-123',
          status: { stage: 'Complete' },
        },
      },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpdateFn).toHaveBeenCalledWith({ status: 'delivered' });
  });

  it('handles order.status.stage.changed — Cancelled maps to cancelled', async () => {
    const payload = {
      type: 'order.status.stage.changed',
      data: {
        order: {
          id: 'prod-123',
          status: { stage: 'Cancelled' },
        },
      },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpdateFn).toHaveBeenCalledWith({ status: 'cancelled' });
  });

  it('handles order.shipped — sets status and tracking URL', async () => {
    const payload = {
      type: 'order.shipped',
      data: {
        order: {
          id: 'prod-123',
          shipments: [
            {
              tracking: {
                url: 'https://track.example.com/12345',
              },
            },
          ],
        },
      },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpdateFn).toHaveBeenCalledWith({
      status: 'shipped',
      tracking_url: 'https://track.example.com/12345',
    });
  });

  it('handles order.shipped — sets status without tracking when absent', async () => {
    const payload = {
      type: 'order.shipped',
      data: {
        order: {
          id: 'prod-123',
          shipments: [],
        },
      },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    expect(mockUpdateFn).toHaveBeenCalledWith({ status: 'shipped' });
  });

  it('acknowledges unknown order IDs without error (stops retries)', async () => {
    // Override select to return no matching order
    const { createClient } = await import('@supabase/supabase-js');
    vi.mocked(createClient).mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }),
    } as any);

    const payload = {
      type: 'order.shipped',
      data: { order: { id: 'unknown-order' } },
    };

    const res = await POST(makeWebhookRequest(payload));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});
