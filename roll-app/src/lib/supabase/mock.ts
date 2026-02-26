/**
 * Mock Supabase client for UI preview mode.
 *
 * When NEXT_PUBLIC_PREVIEW_MODE=true, this replaces the real Supabase client
 * so the entire app can run with zero external services.
 *
 * Supports the chainable query builder pattern:
 *   supabase.from('table').select('*').eq('col', 'val').order(...).limit(...)
 */

const MOCK_USER_ID = 'preview-user-00000000-0000-0000-0000-000000000000';

const MOCK_AUTH_USER = {
  id: MOCK_USER_ID,
  email: 'preview@roll.photos',
  user_metadata: { display_name: 'Joshua Brown' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
};

// ── Mock data per table ──────────────────────────────────────────────

// Real user photos served from /public/photos/
const USER_PHOTOS = [
  '/photos/IMG_0283%20Large.jpeg',
  '/photos/IMG_0289%20Large.jpeg',
  '/photos/IMG_0296%20Large.jpeg',
  '/photos/IMG_0320%20Large.jpeg',
  '/photos/IMG_0358%20Large.jpeg',
  '/photos/IMG_0489%20Large.jpeg',
  '/photos/IMG_0491%20Large.jpeg',
  '/photos/IMG_1071%20Large.jpeg',
  '/photos/IMG_1424%20Large.jpeg',
  '/photos/IMG_1570%20Large.jpeg',
  '/photos/IMG_1585%20Large.jpeg',
  '/photos/IMG_1591%20Large.jpeg',
  '/photos/IMG_1600%20Large.jpeg',
  '/photos/IMG_1603%20Large.jpeg',
  '/photos/IMG_1648%20Large.jpeg',
  '/photos/IMG_1686%20Large.jpeg',
  '/photos/IMG_2543%20Large.jpeg',
  '/photos/IMG_2650%20Large.jpeg',
  '/photos/IMG_2988%20Large.jpeg',
  '/photos/IMG_3068%20Large.jpeg',
  '/photos/IMG_3142%20Large.jpeg',
  '/photos/IMG_3235%20Large.jpeg',
  '/photos/IMG_3360%20Large.jpeg',
  '/photos/IMG_3372%20Large.jpeg',
  '/photos/IMG_3403%20Large.jpeg',
  '/photos/IMG_3410%20Large.jpeg',
  '/photos/IMG_3518%20Large.jpeg',
  '/photos/IMG_3520%20Large.jpeg',
  '/photos/IMG_3528%20Large.jpeg',
  '/photos/IMG_3601%20Large.jpeg',
  '/photos/IMG_3791%20Large.jpeg',
  '/photos/IMG_3801%20Large.jpeg',
  '/photos/IMG_3879%20Large.jpeg',
  '/photos/IMG_3914%20Large.jpeg',
  '/photos/IMG_4498%20Large.jpeg',
  '/photos/IMG_4963%20Large.jpeg',
  '/photos/IMG_5443%20Large.jpeg',
  '/photos/IMG_5503%20Large.jpeg',
  '/photos/IMG_5527%20Large.jpeg',
  '/photos/IMG_5630%20Large.jpeg',
  '/photos/IMG_6724%20Large.jpeg',
  '/photos/IMG_7779%20Large.jpeg',
  '/photos/IMG_9751%20Large.jpeg',
  '/photos/IMG_9946%20Large.jpeg',
  '/photos/76BBD8D2-D7D1-4A75-8207-794B07FFD1D1%20Large.jpeg',
  '/photos/801FB7C1-4CBE-469A-B3E4-91785923EE33%20Large.jpeg',
  '/photos/842FF6DB-19ED-4E40-8201-E742D0D84C59%20Large.jpeg',
  '/photos/9ADD0AF2-5D7B-417D-830A-A29868DE7733%20Large.jpeg',
  '/photos/CD59C42D-DD27-4AD8-8CDA-1B858B9FB4A2%20Large.jpeg',
  '/photos/DB7BD432-EDDD-4B44-8CD1-945BF4B26EAB%20Large.jpeg',
];

function pickPhoto(index: number): string {
  return USER_PHOTOS[index % USER_PHOTOS.length];
}

function picsum(_seed: string, _w = 600, _h = 400, _scenes: string[] = [], index = 0) {
  return pickPhoto(index);
}

function uuid(n: number) {
  return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString();

const MOCK_PROFILE = {
  id: MOCK_USER_ID,
  email: 'preview@roll.photos',
  display_name: 'Joshua Brown',
  avatar_url: USER_PHOTOS[3],
  tier: 'plus' as const,
  onboarding_complete: true,
  photo_count: 84,
  storage_used_bytes: 2_400_000_000,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  referral_code: 'ROLLPREV',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: now,
};

// Photo seeds — curated for a realistic camera roll feel
// Using descriptive seed names for variety
const PHOTO_SEEDS = [
  // People (face_count > 0)
  { seed: 'friends-dinner', faces: 3, scene: ['indoor', 'restaurant'] },
  { seed: 'park-portrait', faces: 1, scene: ['outdoor', 'portrait'] },
  { seed: 'birthday-group', faces: 4, scene: ['indoor', 'event'] },
  { seed: 'coffee-date', faces: 2, scene: ['indoor', 'restaurant'] },
  { seed: 'beach-selfie', faces: 2, scene: ['outdoor', 'portrait'] },
  { seed: 'morning-portrait', faces: 1, scene: ['indoor', 'portrait'] },
  { seed: 'family-kitchen', faces: 3, scene: ['indoor', 'home'] },
  { seed: 'street-smile', faces: 1, scene: ['urban', 'street'] },
  { seed: 'picnic-friends', faces: 4, scene: ['outdoor', 'group'] },
  { seed: 'rooftop-party', faces: 3, scene: ['urban', 'event'] },
  { seed: 'cafe-candid', faces: 1, scene: ['indoor', 'portrait'] },
  { seed: 'dog-walk-selfie', faces: 1, scene: ['outdoor', 'pet'] },
  { seed: 'brunch-crew', faces: 4, scene: ['indoor', 'group'] },
  { seed: 'sunset-couple', faces: 2, scene: ['outdoor', 'portrait'] },
  { seed: 'bookshop-candid', faces: 1, scene: ['indoor', 'portrait'] },
  { seed: 'christmas-family', faces: 5, scene: ['indoor', 'event'] },
  { seed: 'market-faces', faces: 2, scene: ['outdoor', 'travel'] },
  { seed: 'garden-portrait', faces: 1, scene: ['outdoor', 'portrait'] },
  { seed: 'studio-headshot', faces: 1, scene: ['indoor', 'portrait'] },
  { seed: 'concert-friends', faces: 3, scene: ['indoor', 'event'] },
  // Landscapes (face_count = 0, has 'landscape' tag)
  { seed: 'mountain-golden-hour', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'ocean-cliff-sunset', faces: 0, scene: ['landscape', 'beach'] },
  { seed: 'misty-forest-trail', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'desert-road-horizon', faces: 0, scene: ['landscape', 'travel'] },
  { seed: 'lake-reflection-dawn', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'autumn-park-path', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'city-skyline-dusk', faces: 0, scene: ['landscape', 'urban'] },
  { seed: 'vineyard-hills', faces: 0, scene: ['landscape', 'travel'] },
  { seed: 'snowy-cabin-morning', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'coastal-rocks-blue', faces: 0, scene: ['landscape', 'beach'] },
  { seed: 'meadow-wildflowers', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'canyon-layers', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'river-bend-green', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'sunset-wheat-field', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'foggy-bridge-morning', faces: 0, scene: ['landscape', 'urban'] },
  // Other scenes (food, architecture, pets, indoor)
  { seed: 'pasta-dinner-plate', faces: 0, scene: ['food', 'indoor'] },
  { seed: 'latte-art-morning', faces: 0, scene: ['food', 'indoor'] },
  { seed: 'sushi-spread', faces: 0, scene: ['food', 'restaurant'] },
  { seed: 'cat-sleeping-couch', faces: 0, scene: ['pet', 'indoor'] },
  { seed: 'golden-retriever-park', faces: 0, scene: ['pet', 'outdoor'] },
  { seed: 'architecture-glass', faces: 0, scene: ['urban', 'architecture'] },
  { seed: 'street-neon-rain', faces: 0, scene: ['urban', 'street'] },
  { seed: 'bookshelf-home', faces: 0, scene: ['indoor', 'home'] },
  { seed: 'flowers-windowsill', faces: 0, scene: ['indoor', 'home'] },
  { seed: 'vintage-car-detail', faces: 0, scene: ['urban', 'street'] },
  { seed: 'rainy-window-cafe', faces: 0, scene: ['indoor', 'restaurant'] },
  { seed: 'guitar-cozy-room', faces: 0, scene: ['indoor', 'home'] },
  { seed: 'bike-brooklyn-bridge', faces: 0, scene: ['urban', 'travel'] },
  { seed: 'farmers-market-produce', faces: 0, scene: ['outdoor', 'food'] },
  { seed: 'museum-gallery-wide', faces: 0, scene: ['indoor', 'architecture'] },
  // More people for better People filter
  { seed: 'wedding-toast', faces: 2, scene: ['indoor', 'event'] },
  { seed: 'playground-kids', faces: 3, scene: ['outdoor', 'group'] },
  { seed: 'thanksgiving-table', faces: 5, scene: ['indoor', 'event'] },
  { seed: 'yoga-park-session', faces: 1, scene: ['outdoor', 'portrait'] },
  { seed: 'study-library', faces: 1, scene: ['indoor', 'portrait'] },
  // More landscapes
  { seed: 'volcano-clouds', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'waterfall-moss', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'starry-campsite', faces: 0, scene: ['landscape', 'nature'] },
  // Mixed remaining
  { seed: 'marketplace-color', faces: 0, scene: ['travel', 'urban'] },
  { seed: 'old-door-texture', faces: 0, scene: ['urban', 'architecture'] },
  { seed: 'metro-platform', faces: 0, scene: ['urban', 'street'] },
  { seed: 'tennis-court-aerial', faces: 0, scene: ['outdoor', 'sport'] },
  { seed: 'record-store-vinyl', faces: 0, scene: ['indoor', 'urban'] },
  { seed: 'pier-foggy-morning', faces: 0, scene: ['landscape', 'urban'] },
  { seed: 'pottery-hands', faces: 0, scene: ['indoor', 'portrait'] },
  { seed: 'bakery-counter', faces: 0, scene: ['indoor', 'food'] },
  { seed: 'train-window-blur', faces: 0, scene: ['travel', 'urban'] },
  { seed: 'night-market-glow', faces: 0, scene: ['travel', 'food'] },
  { seed: 'cherry-blossom-path', faces: 0, scene: ['landscape', 'nature'] },
  { seed: 'skatepark-action', faces: 1, scene: ['outdoor', 'sport'] },
  { seed: 'cozy-fireplace', faces: 0, scene: ['indoor', 'home'] },
  { seed: 'tide-pool-macro', faces: 0, scene: ['outdoor', 'nature'] },
  { seed: 'graffiti-alley', faces: 0, scene: ['urban', 'street'] },
  { seed: 'rowing-lake-early', faces: 2, scene: ['outdoor', 'sport'] },
  { seed: 'artisan-coffee-pour', faces: 0, scene: ['food', 'indoor'] },
  { seed: 'baby-first-steps', faces: 1, scene: ['indoor', 'portrait'] },
  { seed: 'holiday-lights-street', faces: 0, scene: ['urban', 'event'] },
  { seed: 'campfire-marshmallows', faces: 3, scene: ['outdoor', 'event'] },
  { seed: 'sunrise-balcony', faces: 0, scene: ['landscape', 'home'] },
  { seed: 'staircase-spiral', faces: 0, scene: ['indoor', 'architecture'] },
  { seed: 'sidewalk-chalk-kids', faces: 2, scene: ['outdoor', 'group'] },
  { seed: 'tailgate-bbq', faces: 4, scene: ['outdoor', 'event'] },
];

const CAMERAS = [
  { make: 'Apple', model: 'iPhone 15 Pro' },
  { make: 'Apple', model: 'iPhone 14' },
  { make: 'Apple', model: 'iPhone 13 Pro Max' },
  { make: 'Samsung', model: 'Galaxy S24 Ultra' },
  { make: 'Google', model: 'Pixel 8 Pro' },
];

// Sample video URLs for prototype playback (public Google test videos)
const SAMPLE_VIDEOS = [
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://storage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
];

function generatePhotos(count: number) {
  let videoIndex = 0;
  return Array.from({ length: count }, (_, i) => {
    const config = PHOTO_SEEDS[i % PHOTO_SEEDS.length];
    const camera = CAMERAS[i % CAMERAS.length];
    // Every 10th photo is a video clip
    const isVideo = i % 10 === 7;
    const videoUrl = isVideo ? SAMPLE_VIDEOS[videoIndex++ % SAMPLE_VIDEOS.length] : null;

    return {
      id: uuid(100 + i),
      user_id: MOCK_USER_ID,
      storage_key: isVideo ? (videoUrl as string) : `originals/${MOCK_USER_ID}/photo_${i}.jpg`,
      thumbnail_url: picsum(config.seed, 400, 530, config.scene, i),
      lqip_base64: null,
      content_type: isVideo ? 'video/mp4' : 'image/jpeg',
      media_type: isVideo ? 'video' : 'photo',
      filename: `IMG_${(1000 + i).toString()}.${isVideo ? 'mp4' : 'jpg'}`,
      width: isVideo ? 1920 : 3024,
      height: isVideo ? 1080 : 4032,
      size_bytes: 3500000 + i * 50000,
      file_size_bytes: 3500000 + i * 50000,
      content_hash: `hash_${i}`,
      camera_make: camera.make,
      camera_model: camera.model,
      date_taken: new Date(Date.now() - i * 3600000 - i * 1800000).toISOString(),
      latitude: i % 5 === 0 ? 40.7128 + i * 0.001 : null,
      longitude: i % 5 === 0 ? -74.006 + i * 0.001 : null,
      filter_status: 'visible',
      filter_reason: null,
      aesthetic_score: 0.6 + (i % 10) * 0.035,
      face_count: config.faces,
      scene_classification: config.scene,
      phash: `phash_${i}`,
      preview_storage_key: videoUrl,
      duration_ms: isVideo ? 10000 + (i % 5) * 5000 : null,
      duration_category: isVideo ? 'moment' : null,
      audio_classification: isVideo ? 'ambient' : null,
      stabilization_score: isVideo ? 0.75 : null,
      created_at: new Date(Date.now() - i * 3600000 - i * 1800000).toISOString(),
      updated_at: now,
    };
  });
}

const MOCK_PHOTOS = generatePhotos(84);

const MOCK_ROLLS = [
  {
    id: uuid(200),
    user_id: MOCK_USER_ID,
    name: 'Weekend at the Park',
    status: 'developed',
    film_profile: null,
    photo_count: 24,
    max_photos: 36,
    processing_started_at: yesterday,
    processing_completed_at: yesterday,
    processing_error: null,
    photos_processed: 24,
    correction_skipped_count: 0,
    created_at: lastWeek,
    updated_at: yesterday,
  },
  {
    id: uuid(201),
    user_id: MOCK_USER_ID,
    name: 'Birthday Party',
    status: 'developed',
    film_profile: null,
    photo_count: 36,
    max_photos: 36,
    processing_started_at: twoWeeksAgo,
    processing_completed_at: twoWeeksAgo,
    processing_error: null,
    photos_processed: 36,
    correction_skipped_count: 0,
    created_at: twoWeeksAgo,
    updated_at: twoWeeksAgo,
  },
  {
    id: uuid(202),
    user_id: MOCK_USER_ID,
    name: 'Morning Walk',
    status: 'building',
    film_profile: null,
    photo_count: 18,
    max_photos: 36,
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
    photos_processed: 0,
    correction_skipped_count: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: uuid(203),
    user_id: MOCK_USER_ID,
    name: 'Summer Evenings',
    status: 'ready',
    film_profile: null,
    photo_count: 36,
    max_photos: 36,
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
    photos_processed: 0,
    correction_skipped_count: 0,
    created_at: yesterday,
    updated_at: now,
  },
];

function generateRollPhotos(rollId: string, count: number, offset: number = 0) {
  return Array.from({ length: count }, (_, i) => {
    const photoIndex = offset + i;
    const photo = MOCK_PHOTOS[photoIndex % MOCK_PHOTOS.length];
    return {
      id: uuid(300 + offset + i),
      roll_id: rollId,
      photo_id: photo?.id ?? uuid(100 + photoIndex),
      position: i + 1,
      // Use a scene-appropriate placeholder for processed photos
      processed_storage_key: picsum(
        `corrected-${photoIndex}`,
        400,
        530,
        (photo?.scene_classification as string[]) ?? [],
        photoIndex + 5
      ),
      correction_applied: true,
      created_at: now,
      photos: photo ?? null,
    };
  });
}

const MOCK_REELS = [
  {
    id: uuid(400),
    user_id: MOCK_USER_ID,
    name: 'Summer Highlights',
    status: 'developed',
    film_profile: null,
    audio_mood: 'quiet_film',
    reel_size: 'standard',
    target_duration_ms: 180000,
    current_duration_ms: 147000,
    clip_count: 8,
    processing_started_at: yesterday,
    processing_completed_at: yesterday,
    processing_error: null,
    clips_processed: 8,
    correction_skipped_count: 0,
    assembled_storage_key: `reels/${MOCK_USER_ID}/${uuid(400)}/assembled.mp4`,
    poster_storage_key: USER_PHOTOS[8],
    assembled_duration_ms: 147000,
    created_at: lastWeek,
    updated_at: yesterday,
  },
  {
    id: uuid(401),
    user_id: MOCK_USER_ID,
    name: 'First Steps',
    status: 'building',
    film_profile: null,
    audio_mood: 'original',
    reel_size: 'short',
    target_duration_ms: 60000,
    current_duration_ms: 22000,
    clip_count: 4,
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
    clips_processed: 0,
    correction_skipped_count: 0,
    assembled_storage_key: null,
    poster_storage_key: null,
    assembled_duration_ms: null,
    created_at: now,
    updated_at: now,
  },
];

// Fake circle members
const FAKE_MEMBER_IDS = [uuid(900), uuid(901), uuid(902), uuid(903)];

const FAKE_MEMBER_PROFILES = [
  {
    id: FAKE_MEMBER_IDS[0],
    email: 'jordan@example.com',
    display_name: 'Jordan Lee',
    avatar_url: USER_PHOTOS[7],
    tier: 'plus',
    onboarding_complete: true,
    photo_count: 42,
    storage_used_bytes: 800_000_000,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: twoWeeksAgo,
    updated_at: now,
  },
  {
    id: FAKE_MEMBER_IDS[1],
    email: 'sam@example.com',
    display_name: 'Sam Chen',
    avatar_url: USER_PHOTOS[12],
    tier: 'free',
    onboarding_complete: true,
    photo_count: 18,
    storage_used_bytes: 200_000_000,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: twoWeeksAgo,
    updated_at: now,
  },
  {
    id: FAKE_MEMBER_IDS[2],
    email: 'riley@example.com',
    display_name: 'Riley Park',
    avatar_url: USER_PHOTOS[20],
    tier: 'plus',
    onboarding_complete: true,
    photo_count: 67,
    storage_used_bytes: 1_200_000_000,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: lastWeek,
    updated_at: now,
  },
  {
    id: FAKE_MEMBER_IDS[3],
    email: 'morgan@example.com',
    display_name: 'Morgan Taylor',
    avatar_url: USER_PHOTOS[30],
    tier: 'free',
    onboarding_complete: true,
    photo_count: 9,
    storage_used_bytes: 100_000_000,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    created_at: lastWeek,
    updated_at: now,
  },
];

const MOCK_CIRCLES = [
  {
    id: uuid(500),
    creator_id: MOCK_USER_ID,
    name: 'Family Photos',
    cover_photo_url: USER_PHOTOS[0],
    member_count: 4,
    invite_token: 'abc123',
    created_at: twoWeeksAgo,
    updated_at: now,
  },
  {
    id: uuid(501),
    creator_id: MOCK_USER_ID,
    name: 'NYC Weekend Crew',
    cover_photo_url: USER_PHOTOS[19],
    member_count: 3,
    invite_token: 'def456',
    created_at: lastWeek,
    updated_at: now,
  },
];

const MOCK_CIRCLE_MEMBERS = [
  // Family Photos circle
  {
    id: uuid(550),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: MOCK_USER_ID,
    role: 'creator',
    joined_at: twoWeeksAgo,
  },
  {
    id: uuid(551),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: FAKE_MEMBER_IDS[0],
    role: 'member',
    joined_at: twoWeeksAgo,
  },
  {
    id: uuid(552),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: FAKE_MEMBER_IDS[1],
    role: 'member',
    joined_at: lastWeek,
  },
  {
    id: uuid(553),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: FAKE_MEMBER_IDS[2],
    role: 'member',
    joined_at: lastWeek,
  },
  // NYC Weekend Crew
  {
    id: uuid(554),
    circle_id: MOCK_CIRCLES[1].id,
    user_id: MOCK_USER_ID,
    role: 'creator',
    joined_at: lastWeek,
  },
  {
    id: uuid(555),
    circle_id: MOCK_CIRCLES[1].id,
    user_id: FAKE_MEMBER_IDS[1],
    role: 'member',
    joined_at: lastWeek,
  },
  {
    id: uuid(556),
    circle_id: MOCK_CIRCLES[1].id,
    user_id: FAKE_MEMBER_IDS[3],
    role: 'member',
    joined_at: yesterday,
  },
];

// Circle posts — individual photos shared to circles
const MOCK_CIRCLE_POSTS = [
  {
    id: uuid(560),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: MOCK_USER_ID,
    caption: 'Golden hour never disappoints',
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: uuid(561),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: FAKE_MEMBER_IDS[0],
    caption: 'Missing this place already',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: uuid(562),
    circle_id: MOCK_CIRCLES[0].id,
    user_id: FAKE_MEMBER_IDS[1],
    caption: null,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: uuid(563),
    circle_id: MOCK_CIRCLES[1].id,
    user_id: MOCK_USER_ID,
    caption: 'This roll came out so good',
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: uuid(564),
    circle_id: MOCK_CIRCLES[1].id,
    user_id: FAKE_MEMBER_IDS[3],
    caption: 'The colors are perfect',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

const MOCK_CIRCLE_POST_PHOTOS = [
  {
    id: uuid(570),
    post_id: uuid(560),
    storage_key: USER_PHOTOS[5],
    position: 1,
  },
  {
    id: uuid(571),
    post_id: uuid(561),
    storage_key: USER_PHOTOS[10],
    position: 1,
  },
  {
    id: uuid(572),
    post_id: uuid(561),
    storage_key: USER_PHOTOS[15],
    position: 2,
  },
  {
    id: uuid(573),
    post_id: uuid(562),
    storage_key: USER_PHOTOS[22],
    position: 1,
  },
  {
    id: uuid(574),
    post_id: uuid(563),
    storage_key: USER_PHOTOS[28],
    position: 1,
  },
  {
    id: uuid(575),
    post_id: uuid(563),
    storage_key: USER_PHOTOS[33],
    position: 2,
  },
  {
    id: uuid(576),
    post_id: uuid(564),
    storage_key: USER_PHOTOS[40],
    position: 1,
  },
];

const MOCK_CIRCLE_REACTIONS = [
  {
    id: uuid(580),
    post_id: uuid(560),
    user_id: FAKE_MEMBER_IDS[0],
    reaction_type: 'heart',
    created_at: yesterday,
  },
  {
    id: uuid(581),
    post_id: uuid(560),
    user_id: FAKE_MEMBER_IDS[1],
    reaction_type: 'wow',
    created_at: yesterday,
  },
  {
    id: uuid(582),
    post_id: uuid(561),
    user_id: MOCK_USER_ID,
    reaction_type: 'heart',
    created_at: lastWeek,
  },
  {
    id: uuid(583),
    post_id: uuid(563),
    user_id: FAKE_MEMBER_IDS[3],
    reaction_type: 'smile',
    created_at: yesterday,
  },
];

const MOCK_CIRCLE_COMMENTS = [
  {
    id: uuid(590),
    post_id: uuid(560),
    user_id: FAKE_MEMBER_IDS[0],
    body: 'Incredible shot!',
    created_at: yesterday,
  },
  {
    id: uuid(591),
    post_id: uuid(561),
    user_id: MOCK_USER_ID,
    body: 'Where is this?',
    created_at: lastWeek,
  },
  {
    id: uuid(592),
    post_id: uuid(563),
    user_id: FAKE_MEMBER_IDS[3],
    body: 'Frame-worthy',
    created_at: yesterday,
  },
];

const MOCK_FAVORITES = MOCK_PHOTOS.slice(0, 8).map((p, i) => ({
  id: uuid(600 + i),
  user_id: MOCK_USER_ID,
  photo_id: p.id,
  roll_id: MOCK_ROLLS[0].id,
  created_at: new Date(Date.now() - i * 3600000).toISOString(),
  photos: p,
  rolls: { name: MOCK_ROLLS[0].name },
}));

const MOCK_ORDERS = [
  {
    id: uuid(700),
    user_id: MOCK_USER_ID,
    roll_id: MOCK_ROLLS[0].id,
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 24,
    is_free_first_roll: true,
    shipping_name: 'Joshua Brown',
    shipping_line1: '123 Film Street',
    shipping_line2: 'Apt 4B',
    shipping_city: 'Brooklyn',
    shipping_state: 'NY',
    shipping_postal_code: '11201',
    shipping_country: 'US',
    status: 'delivered',
    prodigi_order_id: 'ord_preview_001',
    tracking_url: 'https://track.example.com/RL123456789',
    estimated_delivery: null,
    subtotal_cents: 0,
    shipping_cents: 0,
    total_cents: 0,
    created_at: twoWeeksAgo,
    updated_at: lastWeek,
  },
  {
    id: uuid(701),
    user_id: MOCK_USER_ID,
    roll_id: MOCK_ROLLS[1].id,
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    is_free_first_roll: false,
    shipping_name: 'Joshua Brown',
    shipping_line1: '123 Film Street',
    shipping_line2: 'Apt 4B',
    shipping_city: 'Brooklyn',
    shipping_state: 'NY',
    shipping_postal_code: '11201',
    shipping_country: 'US',
    status: 'shipped',
    prodigi_order_id: 'ord_preview_002',
    tracking_url: 'https://track.example.com/RL987654321',
    estimated_delivery: new Date(Date.now() + 5 * 86400000).toISOString(),
    subtotal_cents: 1080,
    shipping_cents: 499,
    total_cents: 1579,
    created_at: lastWeek,
    updated_at: yesterday,
  },
];

const MOCK_REFERRALS = [
  {
    id: uuid(800),
    referrer_id: MOCK_USER_ID,
    referred_email: 'friend1@example.com',
    referred_user_id: uuid(810),
    referral_code: 'ROLLPREV',
    status: 'converted',
    reward_granted: true,
    created_at: twoWeeksAgo,
    converted_at: lastWeek,
  },
  {
    id: uuid(801),
    referrer_id: MOCK_USER_ID,
    referred_email: 'friend2@example.com',
    referred_user_id: uuid(811),
    referral_code: 'ROLLPREV',
    status: 'signed_up',
    reward_granted: false,
    created_at: lastWeek,
    converted_at: null,
  },
  {
    id: uuid(802),
    referrer_id: MOCK_USER_ID,
    referred_email: 'friend3@example.com',
    referred_user_id: null,
    referral_code: 'ROLLPREV',
    status: 'pending',
    reward_granted: false,
    created_at: yesterday,
    converted_at: null,
  },
];

// ── Table data lookup ────────────────────────────────────────────────

const TABLE_DATA: Record<string, unknown[]> = {
  photos: MOCK_PHOTOS,
  profiles: [MOCK_PROFILE, ...FAKE_MEMBER_PROFILES],
  users: [MOCK_PROFILE, ...FAKE_MEMBER_PROFILES],
  rolls: MOCK_ROLLS,
  roll_photos: [
    ...generateRollPhotos(MOCK_ROLLS[0].id, 24, 0),
    ...generateRollPhotos(MOCK_ROLLS[1].id, 36, 24),
    ...generateRollPhotos(MOCK_ROLLS[2].id, 18, 60),
    ...generateRollPhotos(MOCK_ROLLS[3].id, 36, 0),
  ],
  reels: MOCK_REELS,
  reel_clips: [],
  circles: MOCK_CIRCLES,
  circle_members: MOCK_CIRCLE_MEMBERS,
  circle_posts: MOCK_CIRCLE_POSTS,
  circle_post_photos: MOCK_CIRCLE_POST_PHOTOS,
  circle_reactions: MOCK_CIRCLE_REACTIONS,
  circle_comments: MOCK_CIRCLE_COMMENTS,
  circle_invites: [],
  favorites: MOCK_FAVORITES,
  orders: MOCK_ORDERS,
  print_orders: MOCK_ORDERS,
  referrals: MOCK_REFERRALS,
  collections: [],
  magazines: [],
  magazine_subscriptions: [],
  push_subscriptions: [],
  people: [],
  tags: [],
  photo_tags: [],
  photo_stacks: generatePhotoStacks(),
};

// ── Chainable mock query builder ─────────────────────────────────────

type FilterFn = (row: Record<string, unknown>) => boolean;

class MockQueryBuilder {
  private tableName: string;
  private rows: Record<string, unknown>[];
  private filters: FilterFn[] = [];
  private selectColumns: string = '*';
  private orderBy: { column: string; ascending: boolean }[] = [];
  private limitCount: number | null = null;
  private isSingle = false;
  private isInsert = false;
  private isUpdate = false;
  private isDelete = false;
  private isUpsert = false;
  private insertData: Record<string, unknown>[] = [];
  private updateData: Record<string, unknown> = {};

  constructor(tableName: string) {
    this.tableName = tableName;
    this.rows = (TABLE_DATA[tableName] ?? []) as Record<string, unknown>[];
  }

  select(columns: string = '*') {
    this.selectColumns = columns;
    return this;
  }

  insert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.isInsert = true;
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data: Record<string, unknown>) {
    this.isUpdate = true;
    this.updateData = data;
    return this;
  }

  upsert(data: Record<string, unknown> | Record<string, unknown>[]) {
    this.isUpsert = true;
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  delete() {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  neq(column: string, value: unknown) {
    this.filters.push((row) => row[column] !== value);
    return this;
  }

  gt(column: string, value: unknown) {
    this.filters.push((row) => (row[column] as number) > (value as number));
    return this;
  }

  gte(column: string, value: unknown) {
    this.filters.push((row) => (row[column] as number) >= (value as number));
    return this;
  }

  lt(column: string, value: unknown) {
    this.filters.push((row) => (row[column] as number) < (value as number));
    return this;
  }

  lte(column: string, value: unknown) {
    this.filters.push((row) => (row[column] as number) <= (value as number));
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push((row) => values.includes(row[column]));
    return this;
  }

  contains(column: string, value: unknown) {
    this.filters.push((row) => {
      const arr = row[column];
      if (Array.isArray(arr) && Array.isArray(value)) {
        return value.every((v) => arr.includes(v));
      }
      return false;
    });
    return this;
  }

  is(column: string, value: unknown) {
    this.filters.push((row) => row[column] === value);
    return this;
  }

  not(_column: string, _operator: string, _value: unknown) {
    return this;
  }

  or(_filter: string) {
    return this;
  }

  ilike(_column: string, _pattern: string) {
    return this;
  }

  like(_column: string, _pattern: string) {
    return this;
  }

  order(column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orderBy.push({ column, ascending: options?.ascending ?? true });
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  range(_from: number, _to: number) {
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isSingle = true;
    return this;
  }

  async then(
    resolve: (
      value: { data: unknown; error: null } | { data: null; error: { message: string } }
    ) => void
  ) {
    resolve(this.execute());
  }

  execute(): { data: unknown; error: null } {
    if (this.isInsert || this.isUpsert) {
      // Persist inserted data into the mock table so subsequent reads find it
      if (!TABLE_DATA[this.tableName]) {
        TABLE_DATA[this.tableName] = [];
      }
      for (const row of this.insertData) {
        // Auto-generate id, created_at, updated_at like real Postgres defaults
        if (!row.id) {
          row.id = crypto.randomUUID();
        }
        if (!row.created_at) {
          row.created_at = new Date().toISOString();
        }
        if (!row.updated_at) {
          row.updated_at = new Date().toISOString();
        }
        (TABLE_DATA[this.tableName] as Record<string, unknown>[]).push({ ...row });
      }
      // When .select().single() is chained, return the first item (not an array)
      if (this.isSingle) {
        return { data: this.insertData[0] ?? null, error: null };
      }
      return { data: this.insertData, error: null };
    }

    if (this.isUpdate) {
      // Apply update to matching rows in-place so subsequent reads see the changes
      const updated: Record<string, unknown>[] = [];
      for (const row of this.rows) {
        const matches = this.filters.every((filter) => filter(row));
        if (matches) {
          Object.assign(row, this.updateData);
          updated.push(row);
        }
      }
      // When .select().single() is chained, return the first updated row
      if (this.isSingle) {
        return { data: updated[0] ?? null, error: null };
      }
      if (this.selectColumns !== '*' || updated.length > 0) {
        return { data: updated, error: null };
      }
      return { data: null, error: null };
    }

    if (this.isDelete) {
      return { data: null, error: null };
    }

    let result = [...this.rows];

    // Apply filters
    for (const filter of this.filters) {
      result = result.filter(filter);
    }

    // Apply ordering
    for (const { column, ascending } of this.orderBy.reverse()) {
      result.sort((a, b) => {
        const aVal = a[column];
        const bVal = b[column];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
      });
    }

    // Apply limit
    if (this.limitCount !== null) {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      return { data: result[0] ?? null, error: null };
    }

    return { data: result, error: null };
  }
}

// ── Mock Supabase auth ───────────────────────────────────────────────

const mockAuth = {
  getUser: async () => ({ data: { user: MOCK_AUTH_USER }, error: null }),
  getSession: async () => ({
    data: {
      session: {
        access_token: 'preview-token',
        refresh_token: 'preview-refresh',
        user: MOCK_AUTH_USER,
      },
    },
    error: null,
  }),
  signInWithPassword: async () => ({ data: { user: MOCK_AUTH_USER, session: {} }, error: null }),
  signInWithOtp: async () => ({ data: {}, error: null }),
  signUp: async () => ({ data: { user: MOCK_AUTH_USER, session: {} }, error: null }),
  signOut: async () => ({ error: null }),
  onAuthStateChange: (_callback: unknown) => ({
    data: {
      subscription: {
        unsubscribe: () => {},
      },
    },
  }),
};

// ── Mock Supabase storage ────────────────────────────────────────────

const mockStorage = {
  from: (_bucket: string) => ({
    upload: async () => ({ data: { path: 'mock-path' }, error: null }),
    getPublicUrl: (path: string) => ({
      data: { publicUrl: path.startsWith('/photos/') ? path : USER_PHOTOS[0] },
    }),
    download: async () => ({ data: new Blob(), error: null }),
    remove: async () => ({ data: [], error: null }),
  }),
};

// ── Export mock client ───────────────────────────────────────────────

export function createMockSupabaseClient() {
  return {
    auth: mockAuth,
    storage: mockStorage,
    from: (table: string) => new MockQueryBuilder(table),
    rpc: async () => ({ data: null, error: null }),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {},
      unsubscribe: () => {},
    }),
  };
}

// ── Mock photo stacks (similar images grouped) ──────────────────────

function generatePhotoStacks() {
  // Group some consecutive photos into stacks to simulate similar photos
  const stacks: Array<{
    id: string;
    top_photo_id: string;
    photo_ids: string[];
    similarity: number;
  }> = [];

  // Stack 1: Friends dinner photos (indices 0, 3, 6 — similar people/indoor scenes)
  stacks.push({
    id: uuid(1000),
    top_photo_id: MOCK_PHOTOS[0].id,
    photo_ids: [MOCK_PHOTOS[0].id, MOCK_PHOTOS[3].id, MOCK_PHOTOS[6].id],
    similarity: 0.87,
  });

  // Stack 2: Landscape photos (indices 20, 21, 22 — mountain, ocean, forest)
  stacks.push({
    id: uuid(1001),
    top_photo_id: MOCK_PHOTOS[20].id,
    photo_ids: [MOCK_PHOTOS[20].id, MOCK_PHOTOS[21].id, MOCK_PHOTOS[22].id, MOCK_PHOTOS[23].id],
    similarity: 0.82,
  });

  // Stack 3: Food photos (indices 35, 36, 37)
  stacks.push({
    id: uuid(1002),
    top_photo_id: MOCK_PHOTOS[35].id,
    photo_ids: [MOCK_PHOTOS[35].id, MOCK_PHOTOS[36].id, MOCK_PHOTOS[37].id],
    similarity: 0.91,
  });

  // Stack 4: Indoor portrait (indices 1, 5, 10)
  stacks.push({
    id: uuid(1003),
    top_photo_id: MOCK_PHOTOS[1].id,
    photo_ids: [MOCK_PHOTOS[1].id, MOCK_PHOTOS[5].id, MOCK_PHOTOS[10].id],
    similarity: 0.78,
  });

  // Stack 5: Event photos (indices 2, 9, 19)
  stacks.push({
    id: uuid(1004),
    top_photo_id: MOCK_PHOTOS[2].id,
    photo_ids: [MOCK_PHOTOS[2].id, MOCK_PHOTOS[9].id, MOCK_PHOTOS[19].id],
    similarity: 0.84,
  });

  return stacks;
}

const MOCK_PHOTO_STACKS = generatePhotoStacks();

export function isPreviewMode(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true';
}

export { MOCK_USER_ID, MOCK_AUTH_USER, MOCK_PROFILE, MOCK_PHOTOS, MOCK_PHOTO_STACKS };
