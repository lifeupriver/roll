/**
 * Mock data for admin dashboard in preview/demo mode.
 * Returns realistic data for each admin API endpoint so the
 * dashboard looks populated without needing a real database.
 */

const PREVIEW_MODE = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true';

export function isAdminPreviewMode(): boolean {
  return PREVIEW_MODE;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(8, '0');
  return `${hex}-0000-4000-8000-${hex}00000000`.slice(0, 36);
}

function daysAgo(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString();
}

function hoursAgo(n: number): string {
  return new Date(Date.now() - n * 3600000).toISOString();
}

// ---------------------------------------------------------------------------
// Mock users
// ---------------------------------------------------------------------------

const MOCK_USERS = [
  {
    id: uuid(1),
    email: 'sarah.chen@gmail.com',
    display_name: 'Sarah Chen',
    tier: 'plus',
    role: 'user',
    photo_count: 847,
    storage_used_bytes: 4_200_000_000,
    onboarding_complete: true,
    created_at: daysAgo(89),
    updated_at: hoursAgo(2),
    stripe_customer_id: 'cus_demo1',
    stripe_subscription_id: 'sub_demo1',
    referral_code: 'SARAH23',
  },
  {
    id: uuid(2),
    email: 'james.w@outlook.com',
    display_name: 'James Wilson',
    tier: 'plus',
    role: 'user',
    photo_count: 623,
    storage_used_bytes: 3_100_000_000,
    onboarding_complete: true,
    created_at: daysAgo(76),
    updated_at: hoursAgo(5),
    stripe_customer_id: 'cus_demo2',
    stripe_subscription_id: 'sub_demo2',
    referral_code: 'JAMES76',
  },
  {
    id: uuid(3),
    email: 'mia.rodriguez@icloud.com',
    display_name: 'Mia Rodriguez',
    tier: 'free',
    role: 'user',
    photo_count: 312,
    storage_used_bytes: 1_800_000_000,
    onboarding_complete: true,
    created_at: daysAgo(62),
    updated_at: hoursAgo(1),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'MIA62',
  },
  {
    id: uuid(4),
    email: 'alex.park@gmail.com',
    display_name: 'Alex Park',
    tier: 'plus',
    role: 'user',
    photo_count: 1204,
    storage_used_bytes: 6_700_000_000,
    onboarding_complete: true,
    created_at: daysAgo(134),
    updated_at: hoursAgo(3),
    stripe_customer_id: 'cus_demo4',
    stripe_subscription_id: 'sub_demo4',
    referral_code: 'ALEX134',
  },
  {
    id: uuid(5),
    email: 'emma.johnson@yahoo.com',
    display_name: 'Emma Johnson',
    tier: 'free',
    role: 'user',
    photo_count: 156,
    storage_used_bytes: 900_000_000,
    onboarding_complete: true,
    created_at: daysAgo(45),
    updated_at: daysAgo(2),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'EMMA45',
  },
  {
    id: uuid(6),
    email: 'noah.kim@gmail.com',
    display_name: 'Noah Kim',
    tier: 'plus',
    role: 'user',
    photo_count: 934,
    storage_used_bytes: 5_200_000_000,
    onboarding_complete: true,
    created_at: daysAgo(112),
    updated_at: hoursAgo(8),
    stripe_customer_id: 'cus_demo6',
    stripe_subscription_id: 'sub_demo6',
    referral_code: 'NOAH112',
  },
  {
    id: uuid(7),
    email: 'olivia.brown@gmail.com',
    display_name: 'Olivia Brown',
    tier: 'free',
    role: 'user',
    photo_count: 78,
    storage_used_bytes: 420_000_000,
    onboarding_complete: true,
    created_at: daysAgo(21),
    updated_at: daysAgo(3),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'OLIV21',
  },
  {
    id: uuid(8),
    email: 'liam.taylor@icloud.com',
    display_name: 'Liam Taylor',
    tier: 'free',
    role: 'user',
    photo_count: 243,
    storage_used_bytes: 1_300_000_000,
    onboarding_complete: true,
    created_at: daysAgo(38),
    updated_at: daysAgo(1),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'LIAM38',
  },
  {
    id: uuid(9),
    email: 'sophia.martinez@gmail.com',
    display_name: 'Sophia Martinez',
    tier: 'plus',
    role: 'user',
    photo_count: 567,
    storage_used_bytes: 3_400_000_000,
    onboarding_complete: true,
    created_at: daysAgo(95),
    updated_at: hoursAgo(12),
    stripe_customer_id: 'cus_demo9',
    stripe_subscription_id: 'sub_demo9',
    referral_code: 'SOPH95',
  },
  {
    id: uuid(10),
    email: 'ethan.lee@outlook.com',
    display_name: 'Ethan Lee',
    tier: 'free',
    role: 'user',
    photo_count: 45,
    storage_used_bytes: 230_000_000,
    onboarding_complete: false,
    created_at: daysAgo(5),
    updated_at: daysAgo(4),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'ETHAN5',
  },
  {
    id: uuid(11),
    email: 'ava.nguyen@gmail.com',
    display_name: 'Ava Nguyen',
    tier: 'plus',
    role: 'user',
    photo_count: 412,
    storage_used_bytes: 2_300_000_000,
    onboarding_complete: true,
    created_at: daysAgo(67),
    updated_at: hoursAgo(6),
    stripe_customer_id: 'cus_demo11',
    stripe_subscription_id: 'sub_demo11',
    referral_code: 'AVA67',
  },
  {
    id: uuid(12),
    email: 'mason.wright@icloud.com',
    display_name: 'Mason Wright',
    tier: 'free',
    role: 'user',
    photo_count: 189,
    storage_used_bytes: 1_100_000_000,
    onboarding_complete: true,
    created_at: daysAgo(34),
    updated_at: daysAgo(2),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'MAS34',
  },
  {
    id: uuid(13),
    email: 'isabella.white@gmail.com',
    display_name: 'Isabella White',
    tier: 'free',
    role: 'user',
    photo_count: 23,
    storage_used_bytes: 120_000_000,
    onboarding_complete: false,
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'ISA2',
  },
  {
    id: uuid(14),
    email: 'jackson.harris@yahoo.com',
    display_name: 'Jackson Harris',
    tier: 'plus',
    role: 'user',
    photo_count: 756,
    storage_used_bytes: 4_100_000_000,
    onboarding_complete: true,
    created_at: daysAgo(103),
    updated_at: hoursAgo(4),
    stripe_customer_id: 'cus_demo14',
    stripe_subscription_id: 'sub_demo14',
    referral_code: 'JACK103',
  },
  {
    id: uuid(15),
    email: 'charlotte.clark@gmail.com',
    display_name: 'Charlotte Clark',
    tier: 'free',
    role: 'user',
    photo_count: 67,
    storage_used_bytes: 380_000_000,
    onboarding_complete: true,
    created_at: daysAgo(18),
    updated_at: daysAgo(5),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'CHAR18',
  },
  {
    id: uuid(16),
    email: 'aiden.lewis@outlook.com',
    display_name: 'Aiden Lewis',
    tier: 'free',
    role: 'user',
    photo_count: 134,
    storage_used_bytes: 780_000_000,
    onboarding_complete: true,
    created_at: daysAgo(29),
    updated_at: daysAgo(3),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'AIDE29',
  },
  {
    id: uuid(17),
    email: 'amelia.walker@icloud.com',
    display_name: 'Amelia Walker',
    tier: 'plus',
    role: 'user',
    photo_count: 498,
    storage_used_bytes: 2_800_000_000,
    onboarding_complete: true,
    created_at: daysAgo(81),
    updated_at: hoursAgo(9),
    stripe_customer_id: 'cus_demo17',
    stripe_subscription_id: 'sub_demo17',
    referral_code: 'AME81',
  },
  {
    id: uuid(18),
    email: 'lucas.young@gmail.com',
    display_name: 'Lucas Young',
    tier: 'free',
    role: 'user',
    photo_count: 289,
    storage_used_bytes: 1_600_000_000,
    onboarding_complete: true,
    created_at: daysAgo(53),
    updated_at: daysAgo(1),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'LUC53',
  },
  {
    id: uuid(19),
    email: 'harper.king@yahoo.com',
    display_name: 'Harper King',
    tier: 'free',
    role: 'user',
    photo_count: 12,
    storage_used_bytes: 65_000_000,
    onboarding_complete: false,
    created_at: daysAgo(1),
    updated_at: hoursAgo(18),
    stripe_customer_id: null,
    stripe_subscription_id: null,
    referral_code: 'HARP1',
  },
  {
    id: uuid(20),
    email: 'benjamin.scott@gmail.com',
    display_name: 'Benjamin Scott',
    tier: 'plus',
    role: 'user',
    photo_count: 678,
    storage_used_bytes: 3_800_000_000,
    onboarding_complete: true,
    created_at: daysAgo(98),
    updated_at: hoursAgo(7),
    stripe_customer_id: 'cus_demo20',
    stripe_subscription_id: 'sub_demo20',
    referral_code: 'BEN98',
  },
];

// ---------------------------------------------------------------------------
// Mock rolls
// ---------------------------------------------------------------------------

const MOCK_ROLLS = [
  {
    id: uuid(101),
    user_id: uuid(1),
    name: 'Summer in Montauk',
    status: 'developed',
    film_profile: 'warmth',
    photo_count: 36,
    created_at: daysAgo(30),
    updated_at: daysAgo(28),
    processing_started_at: daysAgo(29),
    processing_completed_at: daysAgo(29),
    processing_error: null,
  },
  {
    id: uuid(102),
    user_id: uuid(1),
    name: 'Family Weekend',
    status: 'developed',
    film_profile: 'golden',
    photo_count: 36,
    created_at: daysAgo(15),
    updated_at: daysAgo(14),
    processing_started_at: daysAgo(14),
    processing_completed_at: daysAgo(14),
    processing_error: null,
  },
  {
    id: uuid(103),
    user_id: uuid(2),
    name: 'Portland Trip',
    status: 'developed',
    film_profile: 'classic',
    photo_count: 36,
    created_at: daysAgo(20),
    updated_at: daysAgo(18),
    processing_started_at: daysAgo(19),
    processing_completed_at: daysAgo(19),
    processing_error: null,
  },
  {
    id: uuid(104),
    user_id: uuid(3),
    name: 'Spring Garden',
    status: 'building',
    film_profile: 'vivid',
    photo_count: 24,
    created_at: daysAgo(3),
    updated_at: hoursAgo(4),
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
  },
  {
    id: uuid(105),
    user_id: uuid(4),
    name: 'Tokyo Nights',
    status: 'developed',
    film_profile: 'modern',
    photo_count: 36,
    created_at: daysAgo(45),
    updated_at: daysAgo(43),
    processing_started_at: daysAgo(44),
    processing_completed_at: daysAgo(44),
    processing_error: null,
  },
  {
    id: uuid(106),
    user_id: uuid(4),
    name: 'Kyoto Temples',
    status: 'developed',
    film_profile: 'golden',
    photo_count: 36,
    created_at: daysAgo(40),
    updated_at: daysAgo(38),
    processing_started_at: daysAgo(39),
    processing_completed_at: daysAgo(39),
    processing_error: null,
  },
  {
    id: uuid(107),
    user_id: uuid(6),
    name: 'LA Weekend',
    status: 'processing',
    film_profile: 'warmth',
    photo_count: 36,
    created_at: daysAgo(1),
    updated_at: hoursAgo(2),
    processing_started_at: hoursAgo(2),
    processing_completed_at: null,
    processing_error: null,
  },
  {
    id: uuid(108),
    user_id: uuid(9),
    name: 'Birthday Party',
    status: 'developed',
    film_profile: 'gentle',
    photo_count: 36,
    created_at: daysAgo(25),
    updated_at: daysAgo(24),
    processing_started_at: daysAgo(24),
    processing_completed_at: daysAgo(24),
    processing_error: null,
  },
  {
    id: uuid(109),
    user_id: uuid(11),
    name: 'NYC Street',
    status: 'ready',
    film_profile: 'classic',
    photo_count: 36,
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
  },
  {
    id: uuid(110),
    user_id: uuid(14),
    name: 'Autumn Hike',
    status: 'developed',
    film_profile: 'warmth',
    photo_count: 36,
    created_at: daysAgo(55),
    updated_at: daysAgo(53),
    processing_started_at: daysAgo(54),
    processing_completed_at: daysAgo(54),
    processing_error: null,
  },
  {
    id: uuid(111),
    user_id: uuid(20),
    name: 'Coffee Shop Roll',
    status: 'building',
    film_profile: 'modern',
    photo_count: 18,
    created_at: daysAgo(4),
    updated_at: hoursAgo(8),
    processing_started_at: null,
    processing_completed_at: null,
    processing_error: null,
  },
  {
    id: uuid(112),
    user_id: uuid(8),
    name: 'Dog Park',
    status: 'error',
    film_profile: 'vivid',
    photo_count: 36,
    created_at: daysAgo(7),
    updated_at: daysAgo(6),
    processing_started_at: daysAgo(6),
    processing_completed_at: null,
    processing_error: 'Processing timeout: worker exceeded 5min limit',
  },
  {
    id: uuid(113),
    user_id: uuid(17),
    name: 'Wedding Day',
    status: 'developed',
    film_profile: 'gentle',
    photo_count: 36,
    created_at: daysAgo(60),
    updated_at: daysAgo(58),
    processing_started_at: daysAgo(59),
    processing_completed_at: daysAgo(59),
    processing_error: null,
  },
  {
    id: uuid(114),
    user_id: uuid(2),
    name: 'Beach Sunset',
    status: 'developed',
    film_profile: 'warmth',
    photo_count: 36,
    created_at: daysAgo(10),
    updated_at: daysAgo(9),
    processing_started_at: daysAgo(9),
    processing_completed_at: daysAgo(9),
    processing_error: null,
  },
  {
    id: uuid(115),
    user_id: uuid(6),
    name: 'Food Tour',
    status: 'developed',
    film_profile: 'vivid',
    photo_count: 36,
    created_at: daysAgo(35),
    updated_at: daysAgo(33),
    processing_started_at: daysAgo(34),
    processing_completed_at: daysAgo(34),
    processing_error: null,
  },
];

// ---------------------------------------------------------------------------
// Mock orders
// ---------------------------------------------------------------------------

const MOCK_ORDERS = [
  {
    id: uuid(201),
    user_id: uuid(1),
    roll_id: uuid(101),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'Sarah Chen',
    shipping_line1: '123 Main St',
    shipping_city: 'San Francisco',
    shipping_state: 'CA',
    shipping_postal_code: '94102',
    shipping_country: 'US',
    prodigi_order_id: 'prd_abc123',
    tracking_url: 'https://track.example.com/abc123',
    estimated_delivery: daysAgo(-5),
    created_at: daysAgo(27),
    updated_at: daysAgo(20),
  },
  {
    id: uuid(202),
    user_id: uuid(2),
    roll_id: uuid(103),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'shipped',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'James Wilson',
    shipping_line1: '456 Oak Ave',
    shipping_city: 'Portland',
    shipping_state: 'OR',
    shipping_postal_code: '97201',
    shipping_country: 'US',
    prodigi_order_id: 'prd_def456',
    tracking_url: 'https://track.example.com/def456',
    estimated_delivery: daysAgo(-2),
    created_at: daysAgo(17),
    updated_at: daysAgo(12),
  },
  {
    id: uuid(203),
    user_id: uuid(4),
    roll_id: uuid(105),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'Alex Park',
    shipping_line1: '789 Pine St',
    shipping_city: 'Seattle',
    shipping_state: 'WA',
    shipping_postal_code: '98101',
    shipping_country: 'US',
    prodigi_order_id: 'prd_ghi789',
    tracking_url: 'https://track.example.com/ghi789',
    estimated_delivery: null,
    created_at: daysAgo(42),
    updated_at: daysAgo(35),
  },
  {
    id: uuid(204),
    user_id: uuid(1),
    roll_id: uuid(102),
    product: 'roll_prints',
    print_size: '5x7',
    photo_count: 36,
    status: 'in_production',
    total_cents: 3495,
    is_free_first_roll: false,
    shipping_name: 'Sarah Chen',
    shipping_line1: '123 Main St',
    shipping_city: 'San Francisco',
    shipping_state: 'CA',
    shipping_postal_code: '94102',
    shipping_country: 'US',
    prodigi_order_id: 'prd_jkl012',
    tracking_url: null,
    estimated_delivery: null,
    created_at: daysAgo(12),
    updated_at: daysAgo(10),
  },
  {
    id: uuid(205),
    user_id: uuid(6),
    roll_id: uuid(115),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'Noah Kim',
    shipping_line1: '321 Elm Dr',
    shipping_city: 'Los Angeles',
    shipping_state: 'CA',
    shipping_postal_code: '90001',
    shipping_country: 'US',
    prodigi_order_id: 'prd_mno345',
    tracking_url: 'https://track.example.com/mno345',
    estimated_delivery: null,
    created_at: daysAgo(32),
    updated_at: daysAgo(25),
  },
  {
    id: uuid(206),
    user_id: uuid(9),
    roll_id: uuid(108),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: false,
    shipping_name: 'Sophia Martinez',
    shipping_line1: '654 Cedar Ln',
    shipping_city: 'Austin',
    shipping_state: 'TX',
    shipping_postal_code: '73301',
    shipping_country: 'US',
    prodigi_order_id: 'prd_pqr678',
    tracking_url: 'https://track.example.com/pqr678',
    estimated_delivery: null,
    created_at: daysAgo(23),
    updated_at: daysAgo(16),
  },
  {
    id: uuid(207),
    user_id: uuid(14),
    roll_id: uuid(110),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'Jackson Harris',
    shipping_line1: '987 Birch Rd',
    shipping_city: 'Denver',
    shipping_state: 'CO',
    shipping_postal_code: '80201',
    shipping_country: 'US',
    prodigi_order_id: 'prd_stu901',
    tracking_url: 'https://track.example.com/stu901',
    estimated_delivery: null,
    created_at: daysAgo(50),
    updated_at: daysAgo(43),
  },
  {
    id: uuid(208),
    user_id: uuid(4),
    roll_id: uuid(106),
    product: 'roll_prints',
    print_size: '5x7',
    photo_count: 36,
    status: 'submitted',
    total_cents: 3495,
    is_free_first_roll: false,
    shipping_name: 'Alex Park',
    shipping_line1: '789 Pine St',
    shipping_city: 'Seattle',
    shipping_state: 'WA',
    shipping_postal_code: '98101',
    shipping_country: 'US',
    prodigi_order_id: 'prd_vwx234',
    tracking_url: null,
    estimated_delivery: null,
    created_at: daysAgo(5),
    updated_at: daysAgo(4),
  },
  {
    id: uuid(209),
    user_id: uuid(17),
    roll_id: uuid(113),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'delivered',
    total_cents: 2495,
    is_free_first_roll: true,
    shipping_name: 'Amelia Walker',
    shipping_line1: '147 Maple Way',
    shipping_city: 'Nashville',
    shipping_state: 'TN',
    shipping_postal_code: '37201',
    shipping_country: 'US',
    prodigi_order_id: 'prd_yza567',
    tracking_url: 'https://track.example.com/yza567',
    estimated_delivery: null,
    created_at: daysAgo(56),
    updated_at: daysAgo(48),
  },
  {
    id: uuid(210),
    user_id: uuid(20),
    roll_id: null,
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'pending',
    total_cents: 2495,
    is_free_first_roll: false,
    shipping_name: 'Benjamin Scott',
    shipping_line1: '258 Walnut Ct',
    shipping_city: 'Chicago',
    shipping_state: 'IL',
    shipping_postal_code: '60601',
    shipping_country: 'US',
    prodigi_order_id: null,
    tracking_url: null,
    estimated_delivery: null,
    created_at: daysAgo(1),
    updated_at: hoursAgo(6),
  },
  {
    id: uuid(211),
    user_id: uuid(11),
    roll_id: null,
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'pending',
    total_cents: 2495,
    is_free_first_roll: false,
    shipping_name: 'Ava Nguyen',
    shipping_line1: '369 Spruce Ave',
    shipping_city: 'Boston',
    shipping_state: 'MA',
    shipping_postal_code: '02101',
    shipping_country: 'US',
    prodigi_order_id: null,
    tracking_url: null,
    estimated_delivery: null,
    created_at: hoursAgo(12),
    updated_at: hoursAgo(12),
  },
  {
    id: uuid(212),
    user_id: uuid(2),
    roll_id: uuid(114),
    product: 'roll_prints',
    print_size: '4x6',
    photo_count: 36,
    status: 'cancelled',
    total_cents: 2495,
    is_free_first_roll: false,
    shipping_name: 'James Wilson',
    shipping_line1: '456 Oak Ave',
    shipping_city: 'Portland',
    shipping_state: 'OR',
    shipping_postal_code: '97201',
    shipping_country: 'US',
    prodigi_order_id: null,
    tracking_url: null,
    estimated_delivery: null,
    created_at: daysAgo(8),
    updated_at: daysAgo(7),
  },
];

// ---------------------------------------------------------------------------
// Mock insights
// ---------------------------------------------------------------------------

const MOCK_INSIGHTS = [
  {
    id: uuid(301),
    type: 'growth',
    severity: 'info',
    section: 'users',
    title: 'Users who develop 2+ rolls upgrade at 4.2x the rate',
    body: 'Analysis shows users who develop at least 2 rolls upgrade to Plus at 4.2x the rate of single-roll users. Consider a targeted nudge after the first roll development with a "Your photos look amazing" message and a Plus trial offer.',
    data: { singleRollConversion: 0.034, multiRollConversion: 0.143 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(6),
  },
  {
    id: uuid(302),
    type: 'revenue',
    severity: 'info',
    section: 'orders',
    title: 'Average order value could increase 30% with 5x7 promotion',
    body: 'Currently 78% of print orders are 4x6 only ($24.95 avg). Users who order 5x7 prints have a $34.95 avg order value. A simple "Upgrade to 5x7" upsell during checkout could lift AOV by approximately 30%.',
    data: { currentAOV: 2495, potentialAOV: 3245, pctSmallOnly: 0.78 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(6),
  },
  {
    id: uuid(303),
    type: 'performance',
    severity: 'warning',
    section: 'pipeline',
    title: 'Processing queue depth elevated — 3 jobs stuck > 10 min',
    body: 'The processing queue currently has 3 jobs that have been running for over 10 minutes (normal p95 is 4.2 minutes). These are all "develop" type jobs for rolls with 36 photos. Check worker health and consider restarting stuck jobs.',
    data: { stuckJobs: 3, normalP95: 252000, currentQueueDepth: 8 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(3),
  },
  {
    id: uuid(304),
    type: 'churn',
    severity: 'warning',
    section: 'users',
    title: '6 Plus subscribers inactive for 14+ days',
    body: 'Six Plus subscribers have not opened the app in the last 14 days. Combined MRR at risk: $29.94/month. Consider a re-engagement email showcasing their best photos or a "We miss you" campaign with a free print offer.',
    data: { atRiskUsers: 6, mrrAtRisk: 2994, avgDaysSinceLastActivity: 18 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(6),
  },
  {
    id: uuid(305),
    type: 'cost',
    severity: 'info',
    section: 'orders',
    title: 'Free first roll program has 23% conversion to paid orders',
    body: 'Of 6 free first roll recipients, 23% have placed a subsequent paid order. At an estimated cost of $12 per free roll, the customer acquisition cost is $52.17 per paying customer. This is within a healthy range for a photo printing service.',
    data: { freeRollCount: 6, paidConversion: 0.23, costPerAcquisition: 5217 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(6),
  },
  {
    id: uuid(306),
    type: 'anomaly',
    severity: 'critical',
    section: 'photos',
    title: 'Photo uploads dropped 38% today vs 7-day average',
    body: "Today's upload count (127 photos) is 38% below the 7-day average of 205 photos/day. This could indicate an API issue, app crash on upload, or simply a slow day. Check error logs for upload failures and monitor through tomorrow.",
    data: { todayUploads: 127, avgDailyUploads: 205, dropPct: 38 },
    acknowledged: false,
    acknowledged_by: null,
    acknowledged_at: null,
    created_at: hoursAgo(2),
  },
  {
    id: uuid(307),
    type: 'security',
    severity: 'info',
    section: 'users',
    title: 'No suspicious upload patterns detected',
    body: 'All user upload patterns are within normal bounds over the past 7 days. The highest single-day upload was 47 photos by Alex Park, which is consistent with their typical usage pattern.',
    data: { maxDailyUpload: 47, topUploader: 'Alex Park' },
    acknowledged: true,
    acknowledged_by: uuid(99),
    acknowledged_at: daysAgo(1),
    created_at: daysAgo(1),
  },
];

// ---------------------------------------------------------------------------
// Mock analysis runs
// ---------------------------------------------------------------------------

const MOCK_ANALYSIS_RUNS = [
  {
    id: uuid(401),
    type: 'daily_briefing',
    status: 'completed',
    section: null,
    insights_generated: 5,
    tokens_used: 3247,
    cost_cents: 3,
    created_at: hoursAgo(6),
    completed_at: hoursAgo(6),
  },
  {
    id: uuid(402),
    type: 'weekly_deep_dive',
    status: 'completed',
    section: null,
    insights_generated: 7,
    tokens_used: 8431,
    cost_cents: 8,
    created_at: daysAgo(7),
    completed_at: daysAgo(7),
  },
  {
    id: uuid(403),
    type: 'daily_briefing',
    status: 'completed',
    section: null,
    insights_generated: 4,
    tokens_used: 2891,
    cost_cents: 3,
    created_at: daysAgo(1),
    completed_at: daysAgo(1),
  },
  {
    id: uuid(404),
    type: 'section_analysis',
    status: 'completed',
    section: 'pipeline',
    insights_generated: 2,
    tokens_used: 1654,
    cost_cents: 2,
    created_at: daysAgo(3),
    completed_at: daysAgo(3),
  },
];

// ---------------------------------------------------------------------------
// Mock audit log
// ---------------------------------------------------------------------------

const MOCK_AUDIT_LOG = [
  {
    id: uuid(501),
    admin_id: uuid(99),
    action: 'user.tier_change',
    target_type: 'user',
    target_id: uuid(3),
    metadata: { before: 'free', after: 'plus' },
    ip_address: '192.168.1.1',
    created_at: hoursAgo(4),
  },
  {
    id: uuid(502),
    admin_id: uuid(99),
    action: 'analysis.trigger',
    target_type: null,
    target_id: null,
    metadata: { type: 'daily_briefing' },
    ip_address: '192.168.1.1',
    created_at: hoursAgo(6),
  },
  {
    id: uuid(503),
    admin_id: uuid(99),
    action: 'order.update',
    target_type: 'order',
    target_id: uuid(204),
    metadata: { before: 'submitted', after: 'in_production' },
    ip_address: '192.168.1.1',
    created_at: daysAgo(1),
  },
  {
    id: uuid(504),
    admin_id: uuid(99),
    action: 'user.tier_change',
    target_type: 'user',
    target_id: uuid(7),
    metadata: { before: 'plus', after: 'free' },
    ip_address: '192.168.1.1',
    created_at: daysAgo(2),
  },
  {
    id: uuid(505),
    admin_id: uuid(99),
    action: 'analysis.trigger',
    target_type: null,
    target_id: null,
    metadata: { type: 'weekly_deep_dive' },
    ip_address: '192.168.1.1',
    created_at: daysAgo(7),
  },
  {
    id: uuid(506),
    admin_id: uuid(99),
    action: 'insight.acknowledge',
    target_type: 'insight',
    target_id: uuid(307),
    metadata: {},
    ip_address: '192.168.1.1',
    created_at: daysAgo(1),
  },
  {
    id: uuid(507),
    admin_id: uuid(99),
    action: 'user.role_change',
    target_type: 'user',
    target_id: uuid(99),
    metadata: { before: 'user', after: 'admin' },
    ip_address: '192.168.1.1',
    created_at: daysAgo(14),
  },
];

// ---------------------------------------------------------------------------
// Mock circles
// ---------------------------------------------------------------------------

const MOCK_CIRCLES = [
  {
    id: uuid(601),
    name: 'Family Photos',
    member_count: 8,
    created_at: daysAgo(60),
    creator_id: uuid(1),
  },
  {
    id: uuid(602),
    name: 'Weekend Crew',
    member_count: 5,
    created_at: daysAgo(45),
    creator_id: uuid(4),
  },
  {
    id: uuid(603),
    name: 'Photography Club',
    member_count: 12,
    created_at: daysAgo(80),
    creator_id: uuid(6),
  },
  {
    id: uuid(604),
    name: 'Travel Buddies',
    member_count: 6,
    created_at: daysAgo(35),
    creator_id: uuid(2),
  },
  {
    id: uuid(605),
    name: 'Roommates',
    member_count: 4,
    created_at: daysAgo(22),
    creator_id: uuid(9),
  },
];

// ---------------------------------------------------------------------------
// API Response Generators
// ---------------------------------------------------------------------------

export function getMockStatsResponse() {
  const rollStatusBreakdown: Record<string, number> = {};
  for (const r of MOCK_ROLLS) {
    rollStatusBreakdown[r.status] = (rollStatusBreakdown[r.status] || 0) + 1;
  }

  const totalStorageBytes = MOCK_USERS.reduce((sum, u) => sum + u.storage_used_bytes, 0);

  return {
    stats: {
      users: {
        total: MOCK_USERS.length,
        newToday: 2,
        newThisWeek: 4,
        plusSubscribers: MOCK_USERS.filter((u) => u.tier === 'plus').length,
      },
      photos: {
        total: MOCK_USERS.reduce((sum, u) => sum + u.photo_count, 0),
        uploadedToday: 127,
      },
      rolls: {
        statusBreakdown: rollStatusBreakdown,
        total: MOCK_ROLLS.length,
      },
      orders: {
        total: MOCK_ORDERS.length,
        pending: MOCK_ORDERS.filter((o) =>
          ['pending', 'submitted', 'in_production'].includes(o.status)
        ).length,
      },
      pipeline: {
        pendingJobs: 8,
      },
      storage: {
        totalBytes: totalStorageBytes,
      },
    },
    recentSignups: MOCK_USERS.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
      .slice(0, 10)
      .map((u) => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        tier: u.tier,
        created_at: u.created_at,
      })),
    recentActivity: MOCK_ROLLS.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
      .slice(0, 10)
      .map((r) => ({
        id: r.id,
        name: r.name,
        status: r.status,
        film_profile: r.film_profile,
        user_id: r.user_id,
        updated_at: r.updated_at,
      })),
    insights: MOCK_INSIGHTS.filter((i) => !i.acknowledged).slice(0, 5),
  };
}

export function getMockUsersResponse(params: {
  page?: number;
  limit?: number;
  search?: string;
  tier?: string;
  sort?: string;
  order?: string;
}) {
  const {
    page = 1,
    limit = 50,
    search = '',
    tier = '',
    sort = 'created_at',
    order = 'desc',
  } = params;

  let users = [...MOCK_USERS];

  if (search) {
    const q = search.toLowerCase();
    users = users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) || (u.display_name?.toLowerCase().includes(q) ?? false)
    );
  }
  if (tier === 'free' || tier === 'plus') {
    users = users.filter((u) => u.tier === tier);
  }

  const ascending = order === 'asc';
  users.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[sort];
    const bVal = (b as Record<string, unknown>)[sort];
    if (typeof aVal === 'number' && typeof bVal === 'number')
      return ascending ? aVal - bVal : bVal - aVal;
    return ascending
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const total = users.length;
  const offset = (page - 1) * limit;
  const paged = users.slice(offset, offset + limit);

  return {
    users: paged,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export function getMockUserDetailResponse(userId: string) {
  const profile = MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
  const rolls = MOCK_ROLLS.filter((r) => r.user_id === profile.id).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    film_profile: r.film_profile,
    photo_count: r.photo_count,
    created_at: r.created_at,
    updated_at: r.updated_at,
  }));
  const orders = MOCK_ORDERS.filter((o) => o.user_id === profile.id).map((o) => ({
    id: o.id,
    product: o.product,
    print_size: o.print_size,
    status: o.status,
    total_cents: o.total_cents,
    created_at: o.created_at,
  }));

  return {
    profile,
    rolls,
    orders,
    favoritesCount: Math.floor(profile.photo_count * 0.15),
    circles: [],
    notes: [],
  };
}

export function getMockPhotosResponse() {
  const total = MOCK_USERS.reduce((sum, u) => sum + u.photo_count, 0);
  const visible = Math.round(total * 0.82);
  const filteredAuto = Math.round(total * 0.12);
  const hiddenManual = Math.round(total * 0.03);
  const pending = total - visible - filteredAuto - hiddenManual;

  return {
    total,
    filterStatus: {
      visible,
      filtered_auto: filteredAuto,
      hidden_manual: hiddenManual,
      pending,
    },
    filterReasons: {
      blur: Math.round(filteredAuto * 0.35),
      screenshot: Math.round(filteredAuto * 0.25),
      duplicate: Math.round(filteredAuto * 0.2),
      exposure: Math.round(filteredAuto * 0.12),
      document: Math.round(filteredAuto * 0.08),
    },
    cameras: [
      ['Apple iPhone 15 Pro', Math.round(total * 0.32)] as [string, number],
      ['Apple iPhone 14', Math.round(total * 0.18)] as [string, number],
      ['Samsung Galaxy S24', Math.round(total * 0.12)] as [string, number],
      ['Apple iPhone 13', Math.round(total * 0.09)] as [string, number],
      ['Google Pixel 8', Math.round(total * 0.07)] as [string, number],
      ['Samsung Galaxy S23', Math.round(total * 0.05)] as [string, number],
      ['Apple iPhone 12', Math.round(total * 0.04)] as [string, number],
      ['Sony A7IV', Math.round(total * 0.03)] as [string, number],
      ['Fujifilm X-T5', Math.round(total * 0.02)] as [string, number],
      ['Canon EOS R6', Math.round(total * 0.01)] as [string, number],
    ],
    scenes: [
      ['people', Math.round(total * 0.28)] as [string, number],
      ['outdoor', Math.round(total * 0.22)] as [string, number],
      ['food', Math.round(total * 0.12)] as [string, number],
      ['architecture', Math.round(total * 0.09)] as [string, number],
      ['nature', Math.round(total * 0.08)] as [string, number],
      ['pet', Math.round(total * 0.07)] as [string, number],
      ['cityscape', Math.round(total * 0.05)] as [string, number],
      ['beach', Math.round(total * 0.04)] as [string, number],
      ['night', Math.round(total * 0.03)] as [string, number],
      ['portrait', Math.round(total * 0.02)] as [string, number],
    ],
    aestheticDistribution: {
      '0.3': 12,
      '0.4': 45,
      '0.5': 134,
      '0.6': 312,
      '0.7': 567,
      '0.8': 423,
      '0.9': 189,
    },
    avgAestheticScore: 0.71,
  };
}

export function getMockRollsResponse(statusFilter?: string) {
  const statusBreakdown: Record<string, number> = {};
  const filmProfileBreakdown: Record<string, number> = {};
  let totalProcessingMs = 0;
  let processedCount = 0;
  let errorCount = 0;
  const photoCountDist: number[] = [];

  for (const r of MOCK_ROLLS) {
    statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
    if (r.film_profile)
      filmProfileBreakdown[r.film_profile] = (filmProfileBreakdown[r.film_profile] || 0) + 1;
    photoCountDist.push(r.photo_count);
    if (r.status === 'error') errorCount++;
    if (r.processing_started_at && r.processing_completed_at) {
      totalProcessingMs +=
        new Date(r.processing_completed_at).getTime() - new Date(r.processing_started_at).getTime();
      processedCount++;
    }
  }

  let rolls = [...MOCK_ROLLS];
  if (statusFilter) rolls = rolls.filter((r) => r.status === statusFilter);
  rolls.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  return {
    total: MOCK_ROLLS.length,
    statusBreakdown,
    filmProfileBreakdown: Object.entries(filmProfileBreakdown).sort(([, a], [, b]) => b - a),
    avgProcessingTimeMins: processedCount > 0 ? totalProcessingMs / processedCount / 60000 : 0,
    errorRate: MOCK_ROLLS.length ? (errorCount / MOCK_ROLLS.length) * 100 : 0,
    avgPhotosPerRoll:
      photoCountDist.length > 0
        ? photoCountDist.reduce((a, b) => a + b, 0) / photoCountDist.length
        : 0,
    rolls: rolls.map((r) => ({
      id: r.id,
      name: r.name,
      status: r.status,
      film_profile: r.film_profile,
      photo_count: r.photo_count,
      user_id: r.user_id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      processing_error: r.processing_error,
    })),
  };
}

export function getMockCirclesResponse() {
  const totalPosts = 87;
  const totalReactions = 234;
  const totalComments = 156;
  const avgMembers = MOCK_CIRCLES.reduce((sum, c) => sum + c.member_count, 0) / MOCK_CIRCLES.length;

  const postsPerCircle: Record<string, number> = {
    [uuid(601)]: 23,
    [uuid(602)]: 15,
    [uuid(603)]: 31,
    [uuid(604)]: 12,
    [uuid(605)]: 6,
  };

  return {
    total: MOCK_CIRCLES.length,
    totalPosts,
    totalReactions,
    totalComments,
    avgMembers: avgMembers.toFixed(1),
    topCircles: MOCK_CIRCLES.map((c) => ({
      ...c,
      postCount: postsPerCircle[c.id] ?? 0,
    })),
  };
}

export function getMockOrdersResponse(statusFilter?: string) {
  const statusBreakdown: Record<string, number> = {};
  let totalRevenueCents = 0;
  let freeFirstRollCount = 0;

  for (const o of MOCK_ORDERS) {
    statusBreakdown[o.status] = (statusBreakdown[o.status] || 0) + 1;
    if (o.total_cents) totalRevenueCents += o.total_cents;
    if (o.is_free_first_roll) freeFirstRollCount++;
  }

  let orders = [...MOCK_ORDERS];
  if (statusFilter) orders = orders.filter((o) => o.status === statusFilter);
  orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    total: MOCK_ORDERS.length,
    statusBreakdown,
    totalRevenueCents,
    avgOrderValueCents: MOCK_ORDERS.length ? Math.round(totalRevenueCents / MOCK_ORDERS.length) : 0,
    freeFirstRollCount,
    orders: orders.map((o) => ({
      id: o.id,
      user_id: o.user_id,
      product: o.product,
      print_size: o.print_size,
      photo_count: o.photo_count,
      status: o.status,
      total_cents: o.total_cents,
      is_free_first_roll: o.is_free_first_roll,
      shipping_name: o.shipping_name,
      created_at: o.created_at,
    })),
    page: 1,
    totalPages: 1,
  };
}

export function getMockOrderDetailResponse(orderId: string) {
  const order = MOCK_ORDERS.find((o) => o.id === orderId) ?? MOCK_ORDERS[0];
  return {
    order,
    items: [],
  };
}

export function getMockRevenueResponse() {
  const plusSubscribers = MOCK_USERS.filter((u) => u.tier === 'plus').length;
  const estimatedMRRCents = plusSubscribers * 499;
  const orders = MOCK_ORDERS.filter((o) => o.status !== 'cancelled');
  const orderRevenueCents = orders.reduce((sum, o) => sum + (o.total_cents || 0), 0);
  const freeRolls = MOCK_ORDERS.filter((o) => o.is_free_first_roll);

  // Revenue by month (last 6 months)
  const now = new Date();
  const revenueByMonth: [string, number][] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.toISOString().slice(0, 7);
    // Generate realistic growing revenue
    const base = 4000 + (5 - i) * 1200 + Math.floor(Math.random() * 800);
    revenueByMonth.push([month, base]);
  }

  return {
    plusSubscribers,
    estimatedMRRCents,
    totalOrderRevenueCents: orderRevenueCents,
    totalOrders: orders.length,
    avgOrderValueCents: orders.length > 0 ? Math.round(orderRevenueCents / orders.length) : 0,
    freeFirstRollCount: freeRolls.length,
    estimatedFreeRollCostCents: freeRolls.length * 1200,
    revenueByMonth,
  };
}

export function getMockPipelineResponse() {
  return {
    total: 1247,
    statusBreakdown: {
      pending: 8,
      processing: 3,
      completed: 1218,
      failed: 18,
    },
    typeBreakdown: {
      filter: 534,
      develop: 487,
      generate_thumbnail: 226,
    },
    processingTimeMs: {
      p50: 2400,
      p95: 4200,
      p99: 8700,
    },
    failedJobs: [
      {
        id: uuid(701),
        type: 'develop',
        status: 'failed',
        error_message: 'Processing timeout: worker exceeded 5min limit',
        attempts: 3,
        max_attempts: 3,
        created_at: daysAgo(6),
      },
      {
        id: uuid(702),
        type: 'filter',
        status: 'failed',
        error_message: 'Image too large: 48MP exceeds 36MP limit',
        attempts: 1,
        max_attempts: 3,
        created_at: daysAgo(4),
      },
      {
        id: uuid(703),
        type: 'develop',
        status: 'failed',
        error_message: 'Connection reset: R2 upload failed',
        attempts: 3,
        max_attempts: 3,
        created_at: daysAgo(2),
      },
    ],
  };
}

export function getMockGrowthResponse() {
  const totalUsers = MOCK_USERS.length;
  return {
    funnel: [
      { step: 'Signed Up', count: totalUsers },
      { step: 'Onboarded', count: Math.round(totalUsers * 0.85) },
      { step: 'Uploaded Photos', count: Math.round(totalUsers * 0.75) },
      { step: 'Created Roll', count: Math.round(totalUsers * 0.6) },
      { step: 'Developed Roll', count: Math.round(totalUsers * 0.5) },
      { step: 'Placed Order', count: Math.round(totalUsers * 0.35) },
      { step: 'Upgraded to Plus', count: MOCK_USERS.filter((u) => u.tier === 'plus').length },
    ],
    referrals: {
      total: 47,
      signedUp: 18,
      converted: 11,
    },
  };
}

export function getMockAuditLogResponse(params: { page?: number; action?: string }) {
  const { page = 1, action = '' } = params;
  let entries = [...MOCK_AUDIT_LOG];
  if (action)
    entries = entries.filter((e) => e.action.toLowerCase().includes(action.toLowerCase()));
  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const total = entries.length;
  const limit = 50;
  const offset = (page - 1) * limit;
  const paged = entries.slice(offset, offset + limit);

  return {
    entries: paged,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export function getMockInsightsResponse(params: {
  section?: string;
  severity?: string;
  acknowledged?: string;
}) {
  const { section = '', severity = '', acknowledged } = params;
  let insights = [...MOCK_INSIGHTS];
  if (section) insights = insights.filter((i) => i.section === section);
  if (severity) insights = insights.filter((i) => i.severity === severity);
  if (acknowledged === 'false') insights = insights.filter((i) => !i.acknowledged);
  if (acknowledged === 'true') insights = insights.filter((i) => i.acknowledged);
  insights.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    insights,
    recentRuns: MOCK_ANALYSIS_RUNS,
  };
}

export function getMockAnalysisResponse() {
  return {
    runId: uuid(405),
    insightsGenerated: 4,
    tokensUsed: 3102,
    insights: MOCK_INSIGHTS.filter((i) => !i.acknowledged).slice(0, 4),
  };
}
