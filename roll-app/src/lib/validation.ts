import { z } from 'zod';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_CONTENT_TYPES,
} from '@/lib/utils/constants';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const trimmedString = (max: number) => z.string().trim().min(1).max(max);

// ---------------------------------------------------------------------------
// Roll schemas
// ---------------------------------------------------------------------------

export const createRollSchema = z.object({
  name: z.string().trim().max(100).optional(),
});

export const updateRollSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['building', 'ready', 'processing', 'developed', 'error']).optional(),
  film_profile: z.enum(['warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

export const addRollPhotoSchema = z.object({
  photoId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Circle schemas
// ---------------------------------------------------------------------------

export const createCircleSchema = z.object({
  name: trimmedString(100),
  coverPhotoUrl: z.string().url().optional(),
});

export const createCirclePostSchema = z.object({
  caption: z.string().max(500).optional(),
  photoStorageKeys: z.array(z.string().min(1)).min(1).max(100),
});

export const circleInviteSchema = z.object({
  email: z.string().email().optional(),
});

// ---------------------------------------------------------------------------
// Upload schemas
// ---------------------------------------------------------------------------

export const presignUploadSchema = z.object({
  files: z.array(z.object({
    filename: z.string().min(1).max(255),
    contentType: z.enum(ALLOWED_CONTENT_TYPES),
    sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  })).min(1).max(MAX_FILES_PER_UPLOAD),
});

export const completeUploadSchema = z.object({
  photos: z.array(z.object({
    storageKey: z.string().min(1),
    contentHash: z.string().min(1),
    filename: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    exifData: z.object({
      dateTaken: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      cameraMake: z.string().optional(),
      cameraModel: z.string().optional(),
    }).default({}),
    thumbnailBase64: z.string().optional(),
  })).min(1),
});

// ---------------------------------------------------------------------------
// Order schemas
// ---------------------------------------------------------------------------

export const createOrderSchema = z.object({
  rollId: z.string().uuid(),
  product: z.enum(['roll_prints', 'album_prints', 'individual', 'photo_book']),
  printSize: z.enum(['4x6', '5x7', '8x8']),
  shipping: z.object({
    name: trimmedString(200),
    line1: trimmedString(200),
    line2: z.string().max(200).optional(),
    city: trimmedString(100),
    state: trimmedString(100),
    postalCode: trimmedString(20),
    country: z.string().length(2),
  }),
});

export const printCheckoutSchema = z.object({
  orderId: z.string().uuid(),
});

// ---------------------------------------------------------------------------
// Generic body parser
// ---------------------------------------------------------------------------

/**
 * Parse and validate a JSON request body against a Zod schema.
 * Returns `{ data }` on success or `{ error: NextResponse }` on failure.
 */
export async function parseBody<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): Promise<{ data: z.infer<T>; error?: never } | { data?: never; error: NextResponse }> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      error: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
    return {
      error: NextResponse.json(
        { error: 'Validation error', details: issues },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
