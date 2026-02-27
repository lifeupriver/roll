import type { PushPayload } from '@/types/push';
import { captureError } from '@/lib/sentry';

/**
 * VAPID public key for push subscriptions.
 * Generate a keypair with: npx web-push generate-vapid-keys
 */
export function getVapidPublicKey(): string {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

/**
 * Send a push notification to a specific subscription.
 * Uses the Web Push protocol via the `web-push` npm package.
 * The package is dynamically required — install it for production:
 *   npm install web-push
 */
export async function sendPushNotification(
  subscription: { endpoint: string; keys_p256dh: string; keys_auth: string },
  payload: PushPayload
): Promise<boolean> {
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPrivateKey) {
    console.warn('[push] VAPID_PRIVATE_KEY not set — skipping push notification');
    return false;
  }

  try {
    // Dynamic import to avoid bundler static resolution
    let webpush: {
      setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
      sendNotification: (
        subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
        payload: string
      ) => Promise<void>;
    };
    try {
      // @ts-expect-error — web-push is an optional dependency
      webpush = await import(/* webpackIgnore: true */ 'web-push');
    } catch {
      console.warn('[push] web-push package not installed — skipping push notification');
      return false;
    }

    webpush.setVapidDetails('mailto:hello@roll.photos', getVapidPublicKey(), vapidPrivateKey);

    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys_p256dh,
          auth: subscription.keys_auth,
        },
      },
      JSON.stringify(payload)
    );

    return true;
  } catch (err) {
    captureError(err, { context: 'push-notification' });
    return false;
  }
}
