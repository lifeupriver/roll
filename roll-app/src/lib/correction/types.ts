/**
 * Correction provider abstraction.
 *
 * Supports two providers:
 *   - "eyeq"   — Perfectly Clear WebAPI v2 (images + video)
 *   - "imagen" — Imagen AI REST API v1 (images only, project-based)
 *
 * Provider is selected via CORRECTION_PROVIDER env var (default: "eyeq").
 * When neither provider has valid credentials, correction is skipped gracefully.
 */

export type CorrectionProviderName = 'eyeq' | 'imagen';

export interface CorrectionResult {
  /** The corrected file bytes. */
  correctedBuffer: Buffer;
  /** Provider-specific job/project ID for auditing. */
  jobId: string;
  /** Which provider produced this result. */
  provider: CorrectionProviderName;
}

export interface CorrectionProvider {
  /** Human-readable provider name. */
  readonly name: CorrectionProviderName;

  /** Whether this provider is configured (has API key, etc.). */
  isEnabled(): boolean;

  /** Whether this provider supports video correction. */
  supportsVideo(): boolean;

  /**
   * Correct a single image.
   * Returns null if the provider is not configured.
   * Throws on transient/permanent API errors.
   */
  correctImage(imageBuffer: Buffer, contentType: string): Promise<CorrectionResult | null>;

  /**
   * Correct a single video clip.
   * Returns null if the provider is not configured or doesn't support video.
   * Throws on transient/permanent API errors.
   */
  correctVideo(videoBuffer: Buffer, contentType: string): Promise<CorrectionResult | null>;
}
