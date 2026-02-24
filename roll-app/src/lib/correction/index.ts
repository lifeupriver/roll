/**
 * Correction provider entrypoint.
 *
 * Select provider via CORRECTION_PROVIDER env var:
 *   - "eyeq"   (default) — Perfectly Clear WebAPI v2
 *   - "imagen"            — Imagen AI REST API v1
 *
 * Falls back gracefully when the chosen provider has no credentials configured.
 * For video, falls back to EyeQ automatically if Imagen is selected (Imagen is photo-only).
 */

export type { CorrectionProvider, CorrectionProviderName, CorrectionResult } from './types';

import type { CorrectionProvider, CorrectionResult } from './types';
import { eyeqProvider } from './eyeq';
import { imagenProvider } from './imagen';

const PROVIDERS: Record<string, CorrectionProvider> = {
  eyeq: eyeqProvider,
  imagen: imagenProvider,
};

/**
 * Get the configured correction provider for images.
 */
function getImageProvider(): CorrectionProvider {
  const name = process.env.CORRECTION_PROVIDER || 'eyeq';
  return PROVIDERS[name] ?? eyeqProvider;
}

/**
 * Get the configured correction provider for video.
 * Falls back to EyeQ if the primary provider doesn't support video.
 */
function getVideoProvider(): CorrectionProvider {
  const primary = getImageProvider();
  if (primary.supportsVideo()) return primary;
  // Imagen doesn't support video — fall back to EyeQ
  return eyeqProvider;
}

/**
 * Whether any correction provider is configured and available.
 */
export function isCorrectionEnabled(): boolean {
  return getImageProvider().isEnabled();
}

/**
 * Which provider is currently active for images.
 */
export function activeCorrectionProvider(): string {
  const provider = getImageProvider();
  return provider.isEnabled() ? provider.name : 'none';
}

/**
 * Correct a single image using the configured provider.
 * Returns null if no provider is configured.
 */
export async function correctImage(
  imageBuffer: Buffer,
  contentType: string
): Promise<CorrectionResult | null> {
  const provider = getImageProvider();
  return provider.correctImage(imageBuffer, contentType);
}

/**
 * Correct a single video clip using the configured provider.
 * Returns null if no provider is configured or supports video.
 */
export async function correctVideo(
  videoBuffer: Buffer,
  contentType: string
): Promise<CorrectionResult | null> {
  const provider = getVideoProvider();
  return provider.correctVideo(videoBuffer, contentType);
}
