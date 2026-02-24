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
  user_metadata: { display_name: 'Preview User' },
  app_metadata: {},
  aud: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
};

// ── Mock data per table ──────────────────────────────────────────────

function picsum(id: number, w = 600, h = 400) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

function uuid(n: number) {
  return `00000000-0000-0000-0000-${String(n).padStart(12, '0')}`;
}

const now = new Date().toISOString();
const yesterday = new Date(Date.now() - 86400000).toISOString();
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();

const MOCK_PROFILE = {
  id: MOCK_USER_ID,
  email: 'preview@roll.photos',
  display_name: 'Preview User',
  avatar_url: picsum(64, 200, 200),
  tier: 'plus' as const,
  onboarding_complete: true,
  photo_count: 84,
  storage_used_bytes: 524288000,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: now,
};

function generatePhotos(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: uuid(100 + i),
    user_id: MOCK_USER_ID,
    storage_key: `originals/${MOCK_USER_ID}/photo_${i}.jpg`,
    thumbnail_url: picsum(10 + i, 400, 300),
    content_type: 'image/jpeg',
    media_type: i % 8 === 0 ? 'video' : 'photo',
    width: 3024,
    height: 4032,
    file_size_bytes: 3500000,
    content_hash: `hash_${i}`,
    camera_make: 'Apple',
    camera_model: 'iPhone 15 Pro',
    date_taken: new Date(Date.now() - i * 3600000).toISOString(),
    filter_status: 'visible',
    filter_reason: null,
    aesthetic_score: 0.6 + Math.random() * 0.3,
    face_count: i % 3 === 0 ? 2 : i % 5 === 0 ? 1 : 0,
    scene_classification:
      i % 4 === 0 ? ['landscape', 'nature'] : i % 3 === 0 ? ['indoor', 'warm'] : ['outdoor'],
    phash: `phash_${i}`,
    duration_ms: i % 8 === 0 ? 5000 + i * 1000 : null,
    duration_category: i % 8 === 0 ? 'moment' : null,
    audio_classification: i % 8 === 0 ? 'ambient' : null,
    stabilization_score: i % 8 === 0 ? 0.75 : null,
    created_at: new Date(Date.now() - i * 3600000).toISOString(),
    updated_at: now,
  }));
}

const MOCK_PHOTOS = generatePhotos(84);

const MOCK_ROLLS = [
  {
    id: uuid(200),
    user_id: MOCK_USER_ID,
    name: 'Weekend at the Park',
    status: 'developed',
    film_profile: 'warmth',
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
    film_profile: 'golden',
    photo_count: 36,
    max_photos: 36,
    processing_started_at: lastWeek,
    processing_completed_at: lastWeek,
    processing_error: null,
    photos_processed: 36,
    correction_skipped_count: 0,
    created_at: lastWeek,
    updated_at: lastWeek,
  },
  {
    id: uuid(202),
    user_id: MOCK_USER_ID,
    name: 'Morning Walk',
    status: 'building',
    film_profile: null,
    photo_count: 12,
    max_photos: 36,
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
    photos_processed: 0,
    correction_skipped_count: 0,
    created_at: now,
    updated_at: now,
  },
];

function generateRollPhotos(rollId: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: uuid(300 + i),
    roll_id: rollId,
    photo_id: MOCK_PHOTOS[i]?.id ?? uuid(100 + i),
    position: i,
    processed_storage_key: `processed/${MOCK_USER_ID}/${rollId}/${i}_warmth.jpg`,
    correction_applied: true,
    created_at: now,
  }));
}

const MOCK_REELS = [
  {
    id: uuid(400),
    user_id: MOCK_USER_ID,
    name: 'Summer Highlights',
    status: 'developed',
    film_profile: 'vivid',
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
    assembled_storage_key: `reels/${MOCK_USER_ID}/${uuid(400)}/assembled_vivid.mp4`,
    poster_storage_key: `reels/${MOCK_USER_ID}/${uuid(400)}/poster.webp`,
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

const MOCK_CIRCLES = [
  {
    id: uuid(500),
    name: 'Family',
    created_by: MOCK_USER_ID,
    member_count: 4,
    invite_token: 'abc123',
    created_at: lastWeek,
    updated_at: now,
  },
];

const MOCK_FAVORITES = MOCK_PHOTOS.slice(0, 6).map((p, i) => ({
  id: uuid(600 + i),
  user_id: MOCK_USER_ID,
  photo_id: p.id,
  roll_id: MOCK_ROLLS[0].id,
  created_at: now,
  photos: p,
  rolls: { name: MOCK_ROLLS[0].name, film_profile: MOCK_ROLLS[0].film_profile },
}));

const MOCK_ORDERS = [
  {
    id: uuid(700),
    user_id: MOCK_USER_ID,
    roll_id: MOCK_ROLLS[0].id,
    status: 'delivered',
    product_type: '4x6_prints',
    quantity: 24,
    total_cents: 2400,
    prodigi_order_id: 'ord_preview_001',
    tracking_url: null,
    created_at: lastWeek,
    updated_at: now,
  },
];

const MOCK_REFERRALS = [
  {
    id: uuid(800),
    referrer_id: MOCK_USER_ID,
    referred_email: 'friend@example.com',
    status: 'accepted',
    created_at: lastWeek,
  },
];

// ── Table data lookup ────────────────────────────────────────────────

const TABLE_DATA: Record<string, unknown[]> = {
  photos: MOCK_PHOTOS,
  profiles: [MOCK_PROFILE],
  users: [MOCK_PROFILE],
  rolls: MOCK_ROLLS,
  roll_photos: [
    ...generateRollPhotos(MOCK_ROLLS[0].id, 24),
    ...generateRollPhotos(MOCK_ROLLS[1].id, 36),
  ],
  reels: MOCK_REELS,
  reel_clips: [],
  circles: MOCK_CIRCLES,
  circle_members: [
    {
      id: uuid(550),
      circle_id: MOCK_CIRCLES[0].id,
      user_id: MOCK_USER_ID,
      role: 'owner',
      created_at: lastWeek,
    },
  ],
  circle_posts: [],
  favorites: MOCK_FAVORITES,
  orders: MOCK_ORDERS,
  print_orders: MOCK_ORDERS,
  referrals: MOCK_REFERRALS,
  collections: [],
  push_subscriptions: [],
  people: [],
  tags: [],
  photo_tags: [],
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

  update(_data: Record<string, unknown>) {
    this.isUpdate = true;
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
      return { data: this.insertData, error: null };
    }

    if (this.isUpdate || this.isDelete) {
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
      data: { publicUrl: `https://picsum.photos/seed/${path}/600/400` },
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

export function isPreviewMode(): boolean {
  return process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true';
}

export { MOCK_USER_ID, MOCK_AUTH_USER, MOCK_PROFILE };
