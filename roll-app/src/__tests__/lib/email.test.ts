import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCaptureError = vi.fn();
vi.mock('@/lib/sentry', () => ({
  captureError: (...args: unknown[]) => mockCaptureError(...args),
}));

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { sendEmail } from '@/lib/email/resend';

describe('sendEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-api-key';
  });

  it('returns false and captures error when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');
    expect(result).toBe(false);
    expect(mockCaptureError).toHaveBeenCalledTimes(1);
  });

  it('sends email via Resend API with correct parameters', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const result = await sendEmail('test@example.com', 'Test Subject', '<p>Hello</p>');
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer test-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Roll <noreply@roll.photos>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Hello</p>',
      }),
    });
  });

  it('captures error on API failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    });

    const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');
    expect(result).toBe(false);
    expect(mockCaptureError).toHaveBeenCalledTimes(1);
  });

  it('captures error on network failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));

    const result = await sendEmail('test@example.com', 'Subject', '<p>Body</p>');
    expect(result).toBe(false);
    expect(mockCaptureError).toHaveBeenCalledTimes(1);
  });
});
