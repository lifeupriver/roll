import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// POST /api/seed — populate the current user's account with realistic mock data
// DELETE /api/seed — remove all mock data for the current user
// ---------------------------------------------------------------------------

// Deterministic pseudo-random generator (seeded)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uuid(rand: () => number): string {
  const hex = '0123456789abcdef';
  let s = '';
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      s += '-';
    } else if (i === 14) {
      s += '4';
    } else if (i === 19) {
      s += hex[(((rand() * 16) | 0) & 0x3) | 0x8];
    } else {
      s += hex[(rand() * 16) | 0];
    }
  }
  return s;
}

// Realistic camera models
const CAMERAS = [
  { make: 'Apple', model: 'iPhone 15 Pro' },
  { make: 'Apple', model: 'iPhone 14' },
  { make: 'Apple', model: 'iPhone 13 Pro Max' },
  { make: 'Samsung', model: 'Galaxy S24 Ultra' },
  { make: 'Google', model: 'Pixel 8 Pro' },
  { make: 'Sony', model: 'ILCE-7M4' },
  { make: 'Canon', model: 'EOS R6 Mark II' },
  { make: 'Fujifilm', model: 'X-T5' },
];

// Scene types for classification
const SCENES = [
  ['landscape', 'nature'],
  ['landscape', 'mountain'],
  ['landscape', 'beach'],
  ['landscape', 'sunset'],
  ['urban', 'architecture'],
  ['urban', 'street'],
  ['indoor', 'home'],
  ['indoor', 'restaurant'],
  ['food', 'meal'],
  ['portrait'],
  ['group'],
  ['pet', 'animal'],
  ['travel'],
  ['event', 'celebration'],
];

// City coordinates for location variety
const LOCATIONS = [
  { lat: 40.7128, lng: -74.006 }, // New York
  { lat: 34.0522, lng: -118.2437 }, // Los Angeles
  { lat: 41.8781, lng: -87.6298 }, // Chicago
  { lat: 48.8566, lng: 2.3522 }, // Paris
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 37.7749, lng: -122.4194 }, // San Francisco
  { lat: 45.4642, lng: 9.19 }, // Milan
  { lat: 55.7558, lng: 37.6173 }, // Moscow
  { lat: -33.8688, lng: 151.2093 }, // Sydney
];

// Roll name templates
const ROLL_NAMES = [
  'January 1–7',
  'January 15–21',
  'February 3–9',
  'February 10–16',
  'March 5–11',
  'Summer Trip',
  'Weekend in Brooklyn',
  'Holiday Favorites',
];

// Circle captions
const CAPTIONS = [
  'Missing this place already',
  'Golden hour never disappoints',
  'Sunday mornings',
  'Found this gem around the corner',
  'No filter needed (well, just a little)',
  'This roll came out so good',
  'Remember this day?',
  'Film vibes',
  null,
  null,
];

const COMMENTS = [
  'Love this!',
  'Incredible shot',
  'Where is this?',
  'The colors are perfect',
  'Frame-worthy',
  'This is so beautiful',
  'That light though',
  'Need to go back here',
  'Wow',
  'Adding this to my wall',
];

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role client to bypass RLS for seeding
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
      );
    }
    const admin = createClient(serviceUrl, serviceKey);

    const rand = mulberry32(42);
    const userId = user.id;
    const now = new Date();

    // Track what we create for the response
    const created = {
      photos: 0,
      rolls: 0,
      rollPhotos: 0,
      favorites: 0,
      circles: 0,
      circleMembers: 0,
      circlePosts: 0,
      printOrders: 0,
      referrals: 0,
    };

    // -----------------------------------------------------------------------
    // 1. Update user profile to Roll+ with realistic stats
    // -----------------------------------------------------------------------
    await admin
      .from('profiles')
      .update({
        display_name: user.user_metadata?.display_name || 'Joshua Brown',
        tier: 'plus',
        onboarding_complete: true,
        photo_count: 84,
        storage_used_bytes: 2_400_000_000, // ~2.4 GB
        referral_code: 'ROLL' + userId.slice(0, 4).toUpperCase(),
      })
      .eq('id', userId);

    // -----------------------------------------------------------------------
    // 2. Create 84 photos spanning 3 months
    // -----------------------------------------------------------------------
    const photoIds: string[] = [];
    const photos = [];

    for (let i = 0; i < 84; i++) {
      const id = uuid(rand);
      photoIds.push(id);

      // Spread dates across ~90 days
      const daysAgo = Math.floor(rand() * 90);
      const hoursAgo = Math.floor(rand() * 24);
      const dateTaken = new Date(now);
      dateTaken.setDate(dateTaken.getDate() - daysAgo);
      dateTaken.setHours(hoursAgo, Math.floor(rand() * 60));

      const createdAt = new Date(dateTaken);
      createdAt.setMinutes(createdAt.getMinutes() + Math.floor(rand() * 120));

      const camera = CAMERAS[Math.floor(rand() * CAMERAS.length)];
      const scene = SCENES[Math.floor(rand() * SCENES.length)];
      const loc = rand() > 0.3 ? LOCATIONS[Math.floor(rand() * LOCATIONS.length)] : null;

      // ~30% have faces
      const hasFaces = rand() < 0.3;
      const faceCount = hasFaces ? Math.floor(rand() * 4) + 1 : 0;

      // Use picsum.photos for real-looking thumbnails
      // Each seed gives a consistent image for that ID
      const picsumSeed = 100 + i;
      const thumbnailUrl = `https://picsum.photos/seed/${picsumSeed}/300/400`;

      photos.push({
        id,
        user_id: userId,
        storage_key: `originals/${userId}/${id}.jpg`,
        thumbnail_url: thumbnailUrl,
        lqip_base64: null,
        filename: `IMG_${(1000 + i).toString()}.jpg`,
        content_hash: `sha256_mock_${id.slice(0, 12)}`,
        content_type: 'image/jpeg',
        size_bytes: Math.floor(rand() * 8_000_000) + 2_000_000,
        width: 4032,
        height: 3024,
        date_taken: dateTaken.toISOString(),
        latitude: loc ? loc.lat + (rand() - 0.5) * 0.05 : null,
        longitude: loc ? loc.lng + (rand() - 0.5) * 0.05 : null,
        camera_make: camera.make,
        camera_model: camera.model,
        filter_status: 'visible',
        filter_reason: null,
        aesthetic_score: Math.round((rand() * 4 + 6) * 10) / 10, // 6.0–10.0
        phash: `phash_mock_${id.slice(0, 16)}`,
        face_count: faceCount,
        scene_classification: hasFaces ? ['portrait', ...scene.slice(0, 1)] : scene,
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
      });
    }

    // Also create some filtered photos (visible in Account > Filtered Photos)
    const filteredPhotos = [];
    for (let i = 0; i < 8; i++) {
      const id = uuid(rand);
      const daysAgo = Math.floor(rand() * 60);
      const dateTaken = new Date(now);
      dateTaken.setDate(dateTaken.getDate() - daysAgo);

      const reasons: Array<'blur' | 'screenshot' | 'duplicate' | 'exposure'> = [
        'screenshot',
        'screenshot',
        'blur',
        'blur',
        'duplicate',
        'exposure',
        'screenshot',
        'blur',
      ];

      filteredPhotos.push({
        id,
        user_id: userId,
        storage_key: `originals/${userId}/${id}.jpg`,
        thumbnail_url: `https://picsum.photos/seed/${200 + i}/300/400`,
        lqip_base64: null,
        filename: `IMG_${(2000 + i).toString()}.jpg`,
        content_hash: `sha256_filtered_${id.slice(0, 12)}`,
        content_type: 'image/jpeg',
        size_bytes: Math.floor(rand() * 4_000_000) + 500_000,
        width: rand() > 0.5 ? 1170 : 4032,
        height: rand() > 0.5 ? 2532 : 3024,
        date_taken: dateTaken.toISOString(),
        latitude: null,
        longitude: null,
        camera_make: null,
        camera_model: null,
        filter_status: 'filtered_auto',
        filter_reason: reasons[i],
        aesthetic_score: Math.round(rand() * 3 * 10) / 10,
        phash: `phash_filtered_${id.slice(0, 16)}`,
        face_count: 0,
        scene_classification: [],
        created_at: dateTaken.toISOString(),
        updated_at: dateTaken.toISOString(),
      });
    }

    // Insert all photos in batches
    const allPhotos = [...photos, ...filteredPhotos];
    for (let i = 0; i < allPhotos.length; i += 50) {
      const batch = allPhotos.slice(i, i + 50);
      const { error } = await admin.from('photos').upsert(batch, { onConflict: 'id' });
      if (error) {
        return NextResponse.json(
          { error: `Photos insert failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    created.photos = allPhotos.length;

    // -----------------------------------------------------------------------
    // 3. Create rolls in various states
    // -----------------------------------------------------------------------
    const rollConfigs = [
      { name: ROLL_NAMES[0], status: 'developed', film_profile: 'warmth', photoCount: 36 },
      { name: ROLL_NAMES[2], status: 'developed', film_profile: 'golden', photoCount: 36 },
      { name: ROLL_NAMES[4], status: 'building', film_profile: null, photoCount: 14 },
    ];

    const rollIds: string[] = [];
    const rollData = [];
    let photoIndex = 0;

    for (const cfg of rollConfigs) {
      const rollId = uuid(rand);
      rollIds.push(rollId);

      const createdDate = new Date(now);
      createdDate.setDate(createdDate.getDate() - (rollConfigs.indexOf(cfg) * 30 + 10));

      const developedDate =
        cfg.status === 'developed' ? new Date(createdDate.getTime() + 86_400_000) : null;

      rollData.push({
        id: rollId,
        user_id: userId,
        name: cfg.name,
        status: cfg.status,
        film_profile: cfg.film_profile,
        photo_count: cfg.photoCount,
        max_photos: 36,
        processing_started_at: developedDate
          ? new Date(developedDate.getTime() - 120_000).toISOString()
          : null,
        processing_completed_at: developedDate?.toISOString() ?? null,
        processing_error: null,
        photos_processed: cfg.status === 'developed' ? cfg.photoCount : 0,
        correction_skipped_count: cfg.status === 'developed' ? Math.floor(rand() * 3) : 0,
        created_at: createdDate.toISOString(),
        updated_at: (developedDate ?? createdDate).toISOString(),
      });
    }

    const { error: rollError } = await admin.from('rolls').upsert(rollData, { onConflict: 'id' });
    if (rollError) {
      return NextResponse.json(
        { error: `Rolls insert failed: ${rollError.message}` },
        { status: 500 }
      );
    }
    created.rolls = rollData.length;

    // -----------------------------------------------------------------------
    // 4. Create roll_photos (link photos to rolls)
    // -----------------------------------------------------------------------
    const rollPhotoRows = [];

    for (let r = 0; r < rollConfigs.length; r++) {
      const cfg = rollConfigs[r];
      const rollId = rollIds[r];

      for (let p = 0; p < cfg.photoCount; p++) {
        const pId = photoIds[photoIndex % photoIds.length];
        photoIndex++;

        // For developed rolls, use picsum URL so the image actually displays
        const processedKey =
          cfg.status === 'developed'
            ? `https://picsum.photos/seed/${500 + photoIndex}/300/400`
            : null;

        rollPhotoRows.push({
          id: uuid(rand),
          roll_id: rollId,
          photo_id: pId,
          position: p + 1,
          processed_storage_key: processedKey,
          correction_applied: cfg.status === 'developed' ? rand() > 0.15 : false,
          created_at: new Date(now.getTime() - (90 - photoIndex) * 86_400_000).toISOString(),
        });
      }
    }

    for (let i = 0; i < rollPhotoRows.length; i += 50) {
      const batch = rollPhotoRows.slice(i, i + 50);
      const { error } = await admin.from('roll_photos').upsert(batch, { onConflict: 'id' });
      if (error) {
        return NextResponse.json(
          { error: `Roll photos insert failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    created.rollPhotos = rollPhotoRows.length;

    // -----------------------------------------------------------------------
    // 5. Create favorites (from developed roll photos)
    // -----------------------------------------------------------------------
    const favoriteRows = [];
    // Pick 12 photos from the first developed roll
    const developedRollId = rollIds[0];
    const developedPhotoIds = rollPhotoRows
      .filter((rp) => rp.roll_id === developedRollId)
      .map((rp) => rp.photo_id);

    for (let i = 0; i < Math.min(12, developedPhotoIds.length); i++) {
      if (rand() > 0.3) {
        favoriteRows.push({
          id: uuid(rand),
          user_id: userId,
          photo_id: developedPhotoIds[i],
          roll_id: developedRollId,
          created_at: new Date(now.getTime() - i * 3_600_000).toISOString(),
        });
      }
    }
    // A few from the second developed roll too
    const developedRollId2 = rollIds[1];
    const developedPhotoIds2 = rollPhotoRows
      .filter((rp) => rp.roll_id === developedRollId2)
      .map((rp) => rp.photo_id);

    for (let i = 0; i < Math.min(5, developedPhotoIds2.length); i++) {
      if (rand() > 0.4) {
        favoriteRows.push({
          id: uuid(rand),
          user_id: userId,
          photo_id: developedPhotoIds2[i],
          roll_id: developedRollId2,
          created_at: new Date(now.getTime() - (i + 15) * 3_600_000).toISOString(),
        });
      }
    }

    if (favoriteRows.length > 0) {
      const { error } = await admin.from('favorites').upsert(favoriteRows, { onConflict: 'id' });
      if (error) {
        return NextResponse.json(
          { error: `Favorites insert failed: ${error.message}` },
          { status: 500 }
        );
      }
    }
    created.favorites = favoriteRows.length;

    // -----------------------------------------------------------------------
    // 6. Create circles with members, posts, reactions, comments
    // -----------------------------------------------------------------------

    // Create fake member profiles (these are "other users" in the circle)
    const fakeMemberIds: string[] = [];
    const fakeMembers = [
      { display_name: 'Jordan Lee', email: 'jordan@example.com' },
      { display_name: 'Sam Chen', email: 'sam@example.com' },
      { display_name: 'Riley Park', email: 'riley@example.com' },
      { display_name: 'Morgan Taylor', email: 'morgan@example.com' },
    ];

    for (const member of fakeMembers) {
      const memberId = uuid(rand);
      fakeMemberIds.push(memberId);

      // Insert a profile for each fake member
      await admin.from('profiles').upsert(
        {
          id: memberId,
          email: member.email,
          display_name: member.display_name,
          tier: rand() > 0.5 ? 'plus' : 'free',
          onboarding_complete: true,
          photo_count: Math.floor(rand() * 50) + 10,
          storage_used_bytes: Math.floor(rand() * 1_000_000_000),
        },
        { onConflict: 'id' }
      );
    }

    // Create 2 circles
    const circleConfigs = [
      {
        name: 'Family Photos',
        memberIds: [fakeMemberIds[0], fakeMemberIds[1], fakeMemberIds[2]],
      },
      {
        name: 'NYC Weekend Crew',
        memberIds: [fakeMemberIds[1], fakeMemberIds[3]],
      },
    ];

    for (const circleCfg of circleConfigs) {
      const circleId = uuid(rand);
      const memberCount = circleCfg.memberIds.length + 1; // +1 for creator
      const createdDate = new Date(now);
      createdDate.setDate(createdDate.getDate() - Math.floor(rand() * 60 + 10));

      // Insert circle
      const { error: cErr } = await admin.from('circles').upsert(
        {
          id: circleId,
          creator_id: userId,
          name: circleCfg.name,
          cover_photo_url: null,
          member_count: memberCount,
          created_at: createdDate.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'id' }
      );
      if (cErr) {
        return NextResponse.json(
          { error: `Circle insert failed: ${cErr.message}` },
          { status: 500 }
        );
      }
      created.circles++;

      // Insert members (creator + others)
      const memberRows = [
        {
          id: uuid(rand),
          circle_id: circleId,
          user_id: userId,
          role: 'creator',
          joined_at: createdDate.toISOString(),
        },
        ...circleCfg.memberIds.map((mId) => ({
          id: uuid(rand),
          circle_id: circleId,
          user_id: mId,
          role: 'member' as const,
          joined_at: new Date(
            createdDate.getTime() + Math.floor(rand() * 7 * 86_400_000)
          ).toISOString(),
        })),
      ];

      const { error: mErr } = await admin
        .from('circle_members')
        .upsert(memberRows, { onConflict: 'id' });
      if (mErr) {
        return NextResponse.json(
          { error: `Circle members insert failed: ${mErr.message}` },
          { status: 500 }
        );
      }
      created.circleMembers += memberRows.length;

      // Create posts (5-8 per circle)
      const postCount = Math.floor(rand() * 4) + 5;
      for (let p = 0; p < postCount; p++) {
        const postId = uuid(rand);
        const posterIds = [userId, ...circleCfg.memberIds];
        const posterId = posterIds[Math.floor(rand() * posterIds.length)];
        const caption = CAPTIONS[Math.floor(rand() * CAPTIONS.length)];

        const postDate = new Date(now);
        postDate.setDate(postDate.getDate() - Math.floor(rand() * 30));
        postDate.setHours(Math.floor(rand() * 24), Math.floor(rand() * 60));

        const { error: pErr } = await admin.from('circle_posts').upsert(
          {
            id: postId,
            circle_id: circleId,
            user_id: posterId,
            caption,
            created_at: postDate.toISOString(),
          },
          { onConflict: 'id' }
        );
        if (pErr) {
          return NextResponse.json(
            { error: `Post insert failed: ${pErr.message}` },
            { status: 500 }
          );
        }
        created.circlePosts++;

        // Attach 1-3 photos to the post
        const photoCountForPost = Math.floor(rand() * 3) + 1;
        const postPhotoRows = [];
        for (let pp = 0; pp < photoCountForPost; pp++) {
          // Use picsum URL as storage_key so the /api/photos/serve endpoint redirects to it
          postPhotoRows.push({
            id: uuid(rand),
            post_id: postId,
            storage_key: `https://picsum.photos/seed/${300 + created.circlePosts * 3 + pp}/300/400`,
            position: pp + 1,
          });
        }
        await admin.from('circle_post_photos').upsert(postPhotoRows, { onConflict: 'id' });

        // Add reactions (2-5 per post)
        const reactionCount = Math.floor(rand() * 4) + 2;
        const reactorIds = [userId, ...circleCfg.memberIds];
        const usedReactors = new Set<string>();
        const reactionRows = [];

        for (let r = 0; r < reactionCount && usedReactors.size < reactorIds.length; r++) {
          const reactorId = reactorIds[Math.floor(rand() * reactorIds.length)];
          if (usedReactors.has(reactorId)) continue;
          usedReactors.add(reactorId);

          const types: Array<'heart' | 'smile' | 'wow'> = ['heart', 'smile', 'wow'];
          reactionRows.push({
            id: uuid(rand),
            post_id: postId,
            user_id: reactorId,
            reaction_type: types[Math.floor(rand() * types.length)],
            created_at: new Date(
              postDate.getTime() + Math.floor(rand() * 86_400_000)
            ).toISOString(),
          });
        }
        if (reactionRows.length > 0) {
          await admin.from('circle_reactions').upsert(reactionRows, { onConflict: 'id' });
        }

        // Add comments (0-3 per post)
        const commentCount = Math.floor(rand() * 4);
        const commentRows = [];
        for (let c = 0; c < commentCount; c++) {
          const commenterId = reactorIds[Math.floor(rand() * reactorIds.length)];
          commentRows.push({
            id: uuid(rand),
            post_id: postId,
            user_id: commenterId,
            body: COMMENTS[Math.floor(rand() * COMMENTS.length)],
            created_at: new Date(
              postDate.getTime() + Math.floor(rand() * 172_800_000)
            ).toISOString(),
          });
        }
        if (commentRows.length > 0) {
          await admin.from('circle_comments').upsert(commentRows, { onConflict: 'id' });
        }
      }
    }

    // -----------------------------------------------------------------------
    // 7. Create print orders
    // -----------------------------------------------------------------------
    const orderConfigs = [
      {
        rollId: rollIds[0],
        status: 'delivered',
        isFree: true,
        daysAgo: 45,
        trackingUrl: 'https://track.example.com/RL123456789',
      },
      {
        rollId: rollIds[1],
        status: 'shipped',
        isFree: false,
        daysAgo: 12,
        trackingUrl: 'https://track.example.com/RL987654321',
      },
      {
        rollId: rollIds[1],
        status: 'in_production',
        isFree: false,
        daysAgo: 3,
        trackingUrl: null,
      },
    ];

    for (const cfg of orderConfigs) {
      const orderId = uuid(rand);
      const createdDate = new Date(now);
      createdDate.setDate(createdDate.getDate() - cfg.daysAgo);

      const { error: oErr } = await admin.from('print_orders').upsert(
        {
          id: orderId,
          user_id: userId,
          roll_id: cfg.rollId,
          product: 'roll_prints',
          print_size: '4x6',
          photo_count: 36,
          is_free_first_roll: cfg.isFree,
          shipping_name: user.user_metadata?.display_name || 'Joshua Brown',
          shipping_line1: '123 Film Street',
          shipping_line2: 'Apt 4B',
          shipping_city: 'Brooklyn',
          shipping_state: 'NY',
          shipping_postal_code: '11201',
          shipping_country: 'US',
          prodigi_order_id: `ord_mock_${orderId.slice(0, 8)}`,
          status: cfg.status,
          tracking_url: cfg.trackingUrl,
          estimated_delivery:
            cfg.status === 'shipped'
              ? new Date(now.getTime() + 5 * 86_400_000).toISOString()
              : null,
          subtotal_cents: cfg.isFree ? 0 : 1499,
          shipping_cents: cfg.isFree ? 0 : 499,
          total_cents: cfg.isFree ? 0 : 1998,
          created_at: createdDate.toISOString(),
          updated_at: now.toISOString(),
        },
        { onConflict: 'id' }
      );
      if (oErr) {
        return NextResponse.json(
          { error: `Order insert failed: ${oErr.message}` },
          { status: 500 }
        );
      }
      created.printOrders++;
    }

    // -----------------------------------------------------------------------
    // 8. Create referrals
    // -----------------------------------------------------------------------
    const referralRecords = [
      { email: 'friend1@example.com', status: 'converted' },
      { email: 'friend2@example.com', status: 'signed_up' },
      { email: 'friend3@example.com', status: 'pending' },
      { email: 'friend4@example.com', status: 'pending' },
      { email: 'friend5@example.com', status: 'converted' },
    ];

    for (const ref of referralRecords) {
      const { error: rErr } = await admin.from('referrals').upsert(
        {
          id: uuid(rand),
          referrer_id: userId,
          referred_email: ref.email,
          referred_user_id: ref.status !== 'pending' ? uuid(rand) : null,
          referral_code: 'ROLL' + userId.slice(0, 4).toUpperCase(),
          status: ref.status,
          reward_granted: ref.status === 'converted',
          created_at: new Date(now.getTime() - Math.floor(rand() * 30 * 86_400_000)).toISOString(),
          converted_at:
            ref.status === 'converted'
              ? new Date(now.getTime() - Math.floor(rand() * 10 * 86_400_000)).toISOString()
              : null,
        },
        { onConflict: 'id' }
      );
      if (rErr) {
        return NextResponse.json(
          { error: `Referral insert failed: ${rErr.message}` },
          { status: 500 }
        );
      }
      created.referrals++;
    }

    return NextResponse.json({
      data: {
        message: 'Mock data seeded successfully',
        created,
        userId,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/seed — clean up all mock data for the current user
// ---------------------------------------------------------------------------
export async function DELETE() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Seed endpoint is not available in production' },
      { status: 403 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' },
        { status: 500 }
      );
    }
    const admin = createClient(serviceUrl, serviceKey);
    const userId = user.id;

    // Delete in dependency order (children first)
    // Get circle IDs the user created
    const { data: circles } = await admin.from('circles').select('id').eq('creator_id', userId);
    const circleIds = (circles ?? []).map((c) => c.id);

    if (circleIds.length > 0) {
      // Get post IDs
      const { data: posts } = await admin
        .from('circle_posts')
        .select('id')
        .in('circle_id', circleIds);
      const postIds = (posts ?? []).map((p) => p.id);

      if (postIds.length > 0) {
        await admin.from('circle_comments').delete().in('post_id', postIds);
        await admin.from('circle_reactions').delete().in('post_id', postIds);
        await admin.from('circle_post_photos').delete().in('post_id', postIds);
        await admin.from('circle_posts').delete().in('id', postIds);
      }

      await admin.from('circle_invites').delete().in('circle_id', circleIds);
      await admin.from('circle_members').delete().in('circle_id', circleIds);
      await admin.from('circles').delete().in('id', circleIds);
    }

    // Get roll IDs
    const { data: rolls } = await admin.from('rolls').select('id').eq('user_id', userId);
    const rollIds = (rolls ?? []).map((r) => r.id);

    if (rollIds.length > 0) {
      // Delete print order items for orders belonging to these rolls
      const { data: orders } = await admin.from('print_orders').select('id').in('roll_id', rollIds);
      const orderIds = (orders ?? []).map((o) => o.id);
      if (orderIds.length > 0) {
        await admin.from('print_order_items').delete().in('order_id', orderIds);
      }

      await admin.from('print_orders').delete().eq('user_id', userId);
      await admin.from('roll_photos').delete().in('roll_id', rollIds);
      await admin.from('rolls').delete().eq('user_id', userId);
    }

    await admin.from('favorites').delete().eq('user_id', userId);
    await admin.from('referrals').delete().eq('referrer_id', userId);
    await admin.from('photos').delete().eq('user_id', userId);

    // Clean up fake member profiles (they have @example.com emails)
    await admin.from('profiles').delete().like('email', '%@example.com');

    // Reset profile counts
    await admin.from('profiles').update({ photo_count: 0, storage_used_bytes: 0 }).eq('id', userId);

    return NextResponse.json({
      data: { message: 'All mock data removed for user', userId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
