'use client';

import posthog from 'posthog-js';

let initialized = false;

export function initAnalytics() {
  if (initialized || typeof window === 'undefined') return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';
  if (!key) return;

  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // We capture manually for SPA route changes
    capture_pageleave: true,
    persistence: 'localStorage+cookie',
    autocapture: false, // Explicit events only — keeps data clean
  });

  initialized = true;
}

// ── Typed Event Catalog ────────────────────────────────────────────────

export type AnalyticsEvent =
  // Auth
  | { event: 'user_signed_up' }
  | { event: 'user_logged_in' }
  | { event: 'user_logged_out' }
  // Upload
  | { event: 'photos_uploaded'; properties: { count: number } }
  | { event: 'upload_failed'; properties: { error: string } }
  // Feed
  | { event: 'content_mode_changed'; properties: { mode: string } }
  | { event: 'photo_hidden'; properties: { photoId: string } }
  | { event: 'moment_cluster_expanded'; properties: { clusterId: string } }
  // Roll
  | { event: 'photo_checked'; properties: { rollId: string; photoCount: number } }
  | { event: 'photo_unchecked'; properties: { rollId: string; photoCount: number } }
  | { event: 'roll_created'; properties: { rollId: string } }
  | { event: 'roll_filled'; properties: { rollId: string } }
  | { event: 'roll_develop_started'; properties: { rollId: string; photoCount: number } }
  | { event: 'roll_develop_completed'; properties: { rollId: string; durationMs: number } }
  | { event: 'roll_autofill'; properties: { rollId: string; count: number } }
  // Clips (Reels)
  | { event: 'clip_added'; properties: { reelId: string; clipCount: number } }
  | { event: 'clip_removed'; properties: { reelId: string } }
  | { event: 'reel_created'; properties: { reelId: string } }
  | { event: 'reel_filled'; properties: { reelId: string } }
  | { event: 'reel_trim_opened'; properties: { reelId: string; clipId: string } }
  | {
      event: 'reel_developed';
      properties: { reelId: string; filmProfile: string; audioMood: string };
    }
  | { event: 'reel_config_saved'; properties: { reelId: string; defaultClipLength: number } }
  | { event: 'reel_favorited'; properties: { reelId: string } }
  | { event: 'reel_unfavorited'; properties: { reelId: string } }
  | { event: 'reel_share_initiated'; properties: { reelId: string } }
  | { event: 'clips_added_to_reel'; properties: { reelId: string; clipCount: number } }
  // Favorites
  | { event: 'photo_hearted'; properties: { photoId: string; rollId: string } }
  | { event: 'photo_unhearted'; properties: { photoId: string } }
  // Print orders
  | {
      event: 'print_order_started';
      properties: {
        rollId: string;
        photoCount: number;
        printSize: string;
        isFreeFirstRoll: boolean;
      };
    }
  | { event: 'print_order_completed'; properties: { orderId: string } }
  // Circle
  | { event: 'circle_created'; properties: { circleId: string } }
  | { event: 'circle_invite_sent'; properties: { circleId: string } }
  | { event: 'circle_joined'; properties: { circleId: string } }
  | { event: 'circle_post_shared'; properties: { circleId: string; photoCount: number } }
  // Subscription
  | { event: 'upgrade_started' }
  | { event: 'upgrade_completed' }
  | { event: 'billing_portal_opened' }
  // Navigation
  | { event: '$pageview'; properties: { path: string } };

// ── Track helper ───────────────────────────────────────────────────────

export function track(payload: AnalyticsEvent) {
  if (!initialized || typeof window === 'undefined') return;
  const { event, ...rest } = payload;
  const properties = 'properties' in rest ? rest.properties : undefined;
  posthog.capture(event, properties);
}

// ── Identify helper ────────────────────────────────────────────────────

export function identify(userId: string, traits?: Record<string, unknown>) {
  if (!initialized || typeof window === 'undefined') return;
  posthog.identify(userId, traits);
}

// ── Reset on logout ────────────────────────────────────────────────────

export function resetAnalytics() {
  if (!initialized || typeof window === 'undefined') return;
  posthog.reset();
}
