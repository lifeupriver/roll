import { z } from 'zod';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  MAX_FILES_PER_UPLOAD,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_CONTENT_TYPES,
  ALL_ALLOWED_CONTENT_TYPES,
  MAX_VIDEO_FILE_SIZE_BYTES,
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

export const createCircleReelPostSchema = z.object({
  caption: z.string().max(500).optional(),
  reelId: z.string().uuid(),
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
    contentType: z.enum(ALL_ALLOWED_CONTENT_TYPES),
    sizeBytes: z.number().int().positive().max(MAX_VIDEO_FILE_SIZE_BYTES),
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
// Process schemas
// ---------------------------------------------------------------------------

export const filterProcessSchema = z.object({
  jobId: z.string().optional(),
  photoIds: z.array(z.string().uuid()).min(1),
});

export const developProcessSchema = z.object({
  rollId: z.string().uuid(),
  filmProfileId: z.enum(['warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern']),
});

// ---------------------------------------------------------------------------
// Reel schemas
// ---------------------------------------------------------------------------

export const createReelSchema = z.object({
  name: z.string().trim().max(100).optional(),
  reelSize: z.enum(['short', 'standard', 'feature']).default('short'),
});

export const updateReelSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  status: z.enum(['building', 'ready', 'processing', 'developed', 'error']).optional(),
  film_profile: z.enum(['warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern']).optional(),
  audio_mood: z.enum(['original', 'quiet_film', 'silent_film', 'ambient']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

export const addReelClipSchema = z.object({
  photoId: z.string().uuid(),
  trimStartMs: z.number().int().min(0).default(0),
  trimEndMs: z.number().int().positive().optional(),
});

export const updateReelClipSchema = z.object({
  trimStartMs: z.number().int().min(0).optional(),
  trimEndMs: z.number().int().positive().nullable().optional(),
  position: z.number().int().positive().optional(),
  transitionType: z.enum(['crossfade', 'cut', 'dip_to_black']).optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

export const reorderReelSchema = z.object({
  clipIds: z.array(z.string().uuid()).min(1),
});

export const developReelSchema = z.object({
  reelId: z.string().uuid(),
  filmProfileId: z.enum(['warmth', 'golden', 'vivid', 'classic', 'gentle', 'modern']),
  audioMood: z.enum(['original', 'quiet_film', 'silent_film', 'ambient']).default('original'),
});

export const completeVideoUploadSchema = z.object({
  videos: z.array(z.object({
    storageKey: z.string().min(1),
    contentHash: z.string().min(1),
    filename: z.string().min(1),
    contentType: z.string().min(1),
    sizeBytes: z.number().int().positive(),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    durationMs: z.number().int().positive(),
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
// Circle interaction schemas
// ---------------------------------------------------------------------------

export const circleCommentSchema = z.object({
  postId: z.string().uuid(),
  text: z.string().trim().min(1).max(500),
});

export const deleteCommentSchema = z.object({
  commentId: z.string().uuid(),
});

export const circleReactionSchema = z.object({
  postId: z.string().uuid(),
  reactionType: z.enum(['heart', 'smile', 'wow']),
});

export const removeMemberSchema = z.object({
  userId: z.string().uuid(),
});

export const updateCircleBodySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  coverPhotoUrl: z.string().url().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required',
});

// ---------------------------------------------------------------------------
// Photo / favorite / people schemas
// ---------------------------------------------------------------------------

export const addFavoriteSchema = z.object({
  photoId: z.string().uuid(),
  rollId: z.string().uuid(),
});

export const updatePhotoSchema = z.object({
  filter_status: z.enum(['pending', 'visible', 'filtered_auto', 'hidden_manual']).optional(),
  filter_reason: z.string().max(100).nullable().optional(),
});

export const photoTagCreateSchema = z.object({
  personId: z.string().uuid(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  width: z.number().min(0).max(1),
  height: z.number().min(0).max(1),
});

export const photoTagDeleteSchema = z.object({
  tagId: z.string().uuid(),
});

export const createPersonSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

// ---------------------------------------------------------------------------
// Reorder / push / referral schemas
// ---------------------------------------------------------------------------

export const reorderRollSchema = z.object({
  photoIds: z.array(z.string().uuid()).min(1),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

export const referralInviteBodySchema = z.object({
  email: z.string().email(),
});

// ---------------------------------------------------------------------------
// Print subscription schemas
// ---------------------------------------------------------------------------

const printShippingSchema = z.object({
  name: trimmedString(200),
  line1: trimmedString(200),
  line2: z.string().max(200).optional(),
  city: trimmedString(100),
  state: trimmedString(100),
  postalCode: trimmedString(20),
  country: z.string().length(2).default('US'),
});

export const createPrintSubscriptionSchema = z.object({
  printSize: z.enum(['4x6', '5x7']).default('4x6'),
  frequency: z.enum(['monthly', 'quarterly']).default('monthly'),
  maxPhotos: z.number().int().min(1).max(36).default(36),
  shipping: printShippingSchema,
});

export const updatePrintSubscriptionSchema = z.object({
  subscriptionId: z.string().uuid(),
  isActive: z.boolean().optional(),
  shipping: printShippingSchema.partial().optional(),
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
