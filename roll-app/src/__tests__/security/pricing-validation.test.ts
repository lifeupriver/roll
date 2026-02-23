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

const mockCheckoutCreate = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: vi.fn().mockReturnValue({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockCheckoutCreate(...args),
      },
    },
  }),
  getOrCreateCustomer: vi.fn().mockResolvedValue('cus_test123'),
}));

import { POST } from '@/app/api/billing/print-checkout/route';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/billing/print-checkout', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/billing/print-checkout — server-side pricing', () => {
  const USER_ID = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_APP_URL = 'https://roll.photos';
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    mockCheckoutCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session123',
    });
  });

  it('rejects unauthenticated requests', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'No session' } });
    const res = await POST(makeRequest({ orderId: 'order-1' }));
    expect(res.status).toBe(401);
  });

  it('rejects requests without orderId', async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { email: 'test@example.com', stripe_customer_id: null },
            error: null,
          }),
        }),
      }),
    });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('looks up pricing from DB, not from client request body', async () => {
    const dbOrder = {
      id: 'order-1',
      photo_count: 10,
      print_size: '4x6',
      is_free_first_roll: false,
      user_id: USER_ID,
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { email: 'test@example.com', stripe_customer_id: 'cus_existing' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'print_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: dbOrder,
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    // Client sends a malicious body — only orderId should be used
    const res = await POST(makeRequest({
      orderId: 'order-1',
      amount: 1, // Attacker tries to set price to $0.01
      pricePerPrint: 0,
    }));

    expect(res.status).toBe(200);

    // Verify the Stripe checkout was called with DB-calculated pricing
    expect(mockCheckoutCreate).toHaveBeenCalledTimes(1);
    const sessionArgs = mockCheckoutCreate.mock.calls[0][0];
    const unitAmount = sessionArgs.line_items[0].price_data.unit_amount;

    // Expected: 10 photos * 30 cents (4x6) + 499 shipping = 799 cents
    expect(unitAmount).toBe(799);
  });

  it('calculates 5x7 pricing correctly from DB', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { email: 'test@example.com', stripe_customer_id: 'cus_existing' },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'print_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'order-2',
                    photo_count: 36,
                    print_size: '5x7',
                    is_free_first_roll: false,
                    user_id: USER_ID,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ orderId: 'order-2' }));
    expect(res.status).toBe(200);

    const sessionArgs = mockCheckoutCreate.mock.calls[0][0];
    const unitAmount = sessionArgs.line_items[0].price_data.unit_amount;
    // 36 photos * 75 cents (5x7) + 499 shipping = 3199 cents
    expect(unitAmount).toBe(3199);
  });

  it('rejects orders belonging to a different user', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { email: 'test@example.com', stripe_customer_id: null },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'print_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Not found' },
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ orderId: 'order-someone-else' }));
    expect(res.status).toBe(404);
  });

  it('rejects free first roll orders that should not go through Stripe', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { email: 'test@example.com', stripe_customer_id: null },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === 'print_orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'order-free',
                    photo_count: 10,
                    print_size: '4x6',
                    is_free_first_roll: true,
                    user_id: USER_ID,
                  },
                  error: null,
                }),
              }),
            }),
          }),
        };
      }
      return {};
    });

    const res = await POST(makeRequest({ orderId: 'order-free' }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Free orders');
  });
});
