import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// Track all DB updates for assertions
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      update: (...args: unknown[]) => {
        mockUpdate(...args);
        return {
          eq: vi.fn().mockResolvedValue({ error: null }),
        };
      },
    }),
  }),
}));

const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  }),
  STRIPE_CONFIG: { webhookSecret: 'whsec_test' },
}));

vi.mock('@/lib/sentry', () => ({
  captureError: vi.fn(),
}));

import { POST } from '@/app/api/webhooks/stripe/route';

function makeWebhookRequest(body: unknown, signature = 'sig_test'): NextRequest {
  return new NextRequest('http://localhost:3000/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
      'stripe-signature': signature,
    },
  });
}

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('rejects requests without signature', async () => {
    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing signature');
  });

  it('rejects invalid signatures', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });
    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid signature');
  });

  it('handles checkout.session.completed — upgrades to plus', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: 'user-123' },
          subscription: 'sub_abc',
          customer: 'cus_xyz',
        },
      },
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      tier: 'plus',
      stripe_subscription_id: 'sub_abc',
      stripe_customer_id: 'cus_xyz',
    });
  });

  it('ignores checkout.session.completed for non-subscription mode', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'payment',
          metadata: { userId: 'user-123' },
        },
      },
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('handles customer.subscription.updated — active keeps plus', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_xyz',
          id: 'sub_abc',
          status: 'active',
        },
      },
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      tier: 'plus',
      stripe_subscription_id: 'sub_abc',
    });
  });

  it('handles customer.subscription.updated — past_due downgrades to free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.updated',
      data: {
        object: {
          customer: 'cus_xyz',
          id: 'sub_abc',
          status: 'past_due',
        },
      },
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      tier: 'free',
      stripe_subscription_id: 'sub_abc',
    });
  });

  it('handles customer.subscription.deleted — downgrades to free', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_xyz',
          id: 'sub_deleted',
        },
      },
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({
      tier: 'free',
      stripe_subscription_id: null,
    });
  });

  it('returns 500 on processing errors (not 200)', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          mode: 'subscription',
          metadata: { userId: 'user-123' },
          subscription: 'sub_abc',
          customer: 'cus_xyz',
        },
      },
    });
    // Make the DB call throw
    mockUpdate.mockImplementationOnce(() => {
      throw new Error('DB connection failed');
    });

    const res = await POST(makeWebhookRequest({}));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Webhook processing failed');
  });
});
