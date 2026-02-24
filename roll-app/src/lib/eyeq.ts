/**
 * @deprecated Use `@/lib/correction` instead.
 *
 * This module re-exports from the new correction provider abstraction
 * for backwards compatibility.
 */

export { correctImage, correctVideo, isCorrectionEnabled as isEyeQEnabled } from '@/lib/correction';
