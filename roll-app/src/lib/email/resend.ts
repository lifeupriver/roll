import { captureError } from '@/lib/sentry';

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    captureError(new Error('RESEND_API_KEY is not set'), { context: 'email' });
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Roll <noreply@roll.photos>',
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      captureError(new Error(`Resend API error (${response.status}): ${body}`), {
        context: 'email',
      });
      return false;
    }

    return true;
  } catch (error) {
    captureError(error, { context: 'email' });
    return false;
  }
}
