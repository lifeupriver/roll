import { loadAutomationSettings, type AutomationSettings } from './settings';

// ─── Post-Develop Automation Runner ──────────────────────────────────────────
// Runs enabled automations after a roll is successfully developed.
// Each automation runs independently — a failure in one does not block others.

interface AutomationContext {
  rollId: string;
  rollName: string | null;
  photoCount: number;
  onStatus: (message: string) => void;
}

interface AutomationResult {
  automationsRun: string[];
  errors: string[];
}

export async function runPostDevelopAutomations(
  ctx: AutomationContext
): Promise<AutomationResult> {
  const settings = loadAutomationSettings();
  const result: AutomationResult = { automationsRun: [], errors: [] };

  // Run all enabled automations concurrently
  const tasks: Promise<void>[] = [];

  if (settings.autoDesignMagazine) {
    tasks.push(autoDesignMagazine(ctx, result));
  }

  if (settings.autoPostToCircle && settings.autoPostCircleId) {
    tasks.push(autoPostToCircle(ctx, settings, result));
  }

  if (settings.autoOrderPrints) {
    tasks.push(autoOrderPrints(ctx, settings, result));
  }

  if (settings.autoNotifyFollowers) {
    tasks.push(autoNotifyFollowers(ctx, result));
  }

  await Promise.allSettled(tasks);

  return result;
}

// ─── Auto-Design Magazine ────────────────────────────────────────────────────

async function autoDesignMagazine(
  ctx: AutomationContext,
  result: AutomationResult
): Promise<void> {
  try {
    ctx.onStatus('Designing magazine...');

    const res = await fetch('/api/magazines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: ctx.rollName || 'Untitled Magazine',
        roll_ids: [ctx.rollId],
      }),
    });

    if (res.ok) {
      result.automationsRun.push('magazine');
    } else {
      const err = await res.json().catch(() => ({}));
      result.errors.push(`Magazine: ${err.error || 'Failed to create'}`);
    }
  } catch {
    result.errors.push('Magazine: Network error');
  }
}

// ─── Auto-Post to Circle ─────────────────────────────────────────────────────

async function autoPostToCircle(
  ctx: AutomationContext,
  settings: AutomationSettings,
  result: AutomationResult
): Promise<void> {
  try {
    ctx.onStatus('Sharing to circle...');

    // Fetch the roll's processed photos to get storage keys
    const photosRes = await fetch(`/api/rolls/${ctx.rollId}/photos`);
    if (!photosRes.ok) {
      result.errors.push('Circle: Failed to load roll photos');
      return;
    }

    const photosJson = await photosRes.json();
    const rollPhotos = photosJson.data ?? [];

    // Get processed storage keys for the circle post
    const storageKeys = rollPhotos
      .map((rp: Record<string, unknown>) => {
        const photo = rp.photos as Record<string, unknown> | undefined;
        return rp.processed_storage_key || photo?.storage_key || null;
      })
      .filter(Boolean) as string[];

    if (storageKeys.length === 0) {
      result.errors.push('Circle: No processed photos found');
      return;
    }

    const res = await fetch(`/api/circles/${settings.autoPostCircleId}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caption: ctx.rollName ? `📷 ${ctx.rollName}` : null,
        photoStorageKeys: storageKeys.slice(0, 20), // Limit to 20 photos per post
      }),
    });

    if (res.ok) {
      result.automationsRun.push('circle');
    } else {
      const err = await res.json().catch(() => ({}));
      result.errors.push(`Circle: ${err.error || 'Failed to post'}`);
    }
  } catch {
    result.errors.push('Circle: Network error');
  }
}

// ─── Auto-Order Prints ───────────────────────────────────────────────────────

async function autoOrderPrints(
  ctx: AutomationContext,
  settings: AutomationSettings,
  result: AutomationResult
): Promise<void> {
  try {
    ctx.onStatus('Checking print readiness...');

    // Check if shipping address is saved
    const savedAddress = localStorage.getItem('roll-shipping-address');
    if (!savedAddress) {
      result.errors.push('Prints: No shipping address saved — set one in account settings');
      return;
    }

    const shipping = JSON.parse(savedAddress);

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rollId: ctx.rollId,
        product: 'roll_prints',
        printSize: settings.autoOrderPrintSize,
        shipping,
      }),
    });

    if (res.ok) {
      result.automationsRun.push('prints');
    } else {
      const err = await res.json().catch(() => ({}));
      result.errors.push(`Prints: ${err.error || 'Failed to order'}`);
    }
  } catch {
    result.errors.push('Prints: Network error');
  }
}

// ─── Auto-Notify Followers ───────────────────────────────────────────────────

async function autoNotifyFollowers(
  ctx: AutomationContext,
  result: AutomationResult
): Promise<void> {
  try {
    ctx.onStatus('Notifying followers...');

    // Post a blog draft to make the roll visible, then publish it
    const res = await fetch('/api/blog/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rollId: ctx.rollId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      result.errors.push(`Notify: ${err.error || 'Failed to create post'}`);
      return;
    }

    const { data: post } = await res.json();

    // Auto-publish the post
    const publishRes = await fetch(`/api/blog/posts/${post.id}/publish`, {
      method: 'POST',
    });

    if (publishRes.ok) {
      result.automationsRun.push('notify');
    } else {
      result.errors.push('Notify: Created draft but failed to publish');
    }
  } catch {
    result.errors.push('Notify: Network error');
  }
}
