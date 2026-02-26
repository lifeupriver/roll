export const MAX_FILES_PER_UPLOAD = 500;
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/heic',
  'image/heif',
  'image/png',
  'image/webp',
] as const;
export const THUMBNAIL_WIDTH = 400;
export const PHOTOS_PER_PAGE = 20;
export const MAX_ROLL_PHOTOS = 36;
export const MIN_ROLL_PHOTOS = 10;

export const BLUR_THRESHOLD = 100;
export const OVER_EXPOSURE_THRESHOLD = 230;
export const UNDER_EXPOSURE_THRESHOLD = 25;
export const DOCUMENT_TEXT_RATIO_THRESHOLD = 0.4;
export const DUPLICATE_PHASH_DISTANCE_THRESHOLD = 5;

export const SCREENSHOT_RATIOS = [
  { w: 9, h: 16, tolerance: 0.05 },
  { w: 9, h: 19.5, tolerance: 0.05 },
  { w: 9, h: 20, tolerance: 0.05 },
];

// Video constants
export const ALLOWED_VIDEO_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/x-m4v'] as const;

export const ALL_ALLOWED_CONTENT_TYPES = [
  ...ALLOWED_CONTENT_TYPES,
  ...ALLOWED_VIDEO_CONTENT_TYPES,
] as const;

export const MAX_VIDEO_FILE_SIZE_BYTES = 500 * 1024 * 1024; // 500MB
export const MAX_VIDEO_DURATION_MS = 600_000; // 10 minutes max per clip
export const MIN_VIDEO_DURATION_MS = 1_500; // 1.5 seconds min (below = accidental)
export const VIDEO_STABILIZATION_THRESHOLD = 0.6;

// Reel constants
export const MIN_REEL_CLIPS = 3;
export const MIN_REEL_DURATION_MS = 15_000; // 15 seconds
export const REEL_SHORT_DURATION_MS = 60_000;
export const REEL_STANDARD_DURATION_MS = 180_000;
export const REEL_FEATURE_DURATION_MS = 300_000;

// Duration categories
export const DURATION_FLASH_MAX_MS = 5_000;
export const DURATION_MOMENT_MAX_MS = 30_000;
// Above 30s = 'scene'
