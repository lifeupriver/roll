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
