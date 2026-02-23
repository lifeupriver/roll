# Roll Admin Dashboard — Comprehensive Implementation Plan

## Architecture Overview

**Stack**: Next.js 15 App Router, Supabase (Postgres + Auth), Tailwind CSS v4, Cloudflare R2, Stripe, Resend, Prodigi, Claude AI API

**Route**: `/admin/*` — separate route group `(admin)` with its own layout, middleware, and dark-mode-by-default design
**Auth**: `role` column on `profiles` table (`user` | `admin`), checked in middleware + API routes
**Service client**: Admin API routes use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for cross-user queries
**AI**: Claude API called via server-side scheduled jobs + on-demand, insights stored in DB

---

## New Database Tables

```sql
-- 1. Admin audit log
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL,              -- e.g. 'user.tier_change', 'order.cancel', 'insight.acknowledge'
  target_type TEXT,                  -- 'user', 'order', 'roll', etc.
  target_id UUID,
  metadata JSONB DEFAULT '{}',      -- action-specific data (before/after values)
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Admin insights (AI-generated)
CREATE TABLE admin_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                -- 'anomaly', 'growth', 'cost', 'security', 'performance', 'churn', 'revenue'
  severity TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'critical'
  section TEXT NOT NULL,             -- 'home', 'users', 'photos', 'rolls', 'orders', 'circles', 'pipeline', 'growth'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',          -- structured data backing the insight
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. AI analysis runs
CREATE TABLE admin_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,                -- 'daily_briefing', 'weekly_deep_dive', 'on_demand', 'section_analysis'
  section TEXT,                      -- which section triggered it (null for full analysis)
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  input_summary JSONB,              -- aggregated data sent to Claude
  output JSONB,                     -- raw Claude response
  insights_generated INT DEFAULT 0,
  tokens_used INT DEFAULT 0,
  cost_cents INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 4. Admin notes (on users, orders, etc.)
CREATE TABLE admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  target_type TEXT NOT NULL,         -- 'user', 'order', 'roll'
  target_id UUID NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Add role column to profiles
ALTER TABLE profiles ADD COLUMN role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'));
CREATE INDEX idx_profiles_role ON profiles(role) WHERE role = 'admin';
```

---

## File Structure

```
src/
├── app/
│   ├── (admin)/
│   │   ├── layout.tsx                    # Admin shell (sidebar, topbar, dark mode)
│   │   ├── admin/
│   │   │   ├── page.tsx                  # Home dashboard (vital signs)
│   │   │   ├── users/
│   │   │   │   ├── page.tsx              # User list + search
│   │   │   │   └── [id]/page.tsx         # User detail
│   │   │   ├── photos/page.tsx           # Photo analytics
│   │   │   ├── rolls/
│   │   │   │   ├── page.tsx              # Roll analytics
│   │   │   │   └── [id]/page.tsx         # Roll detail
│   │   │   ├── circles/page.tsx          # Circle analytics
│   │   │   ├── orders/
│   │   │   │   ├── page.tsx              # Order management
│   │   │   │   └── [id]/page.tsx         # Order detail
│   │   │   ├── revenue/page.tsx          # Revenue dashboard
│   │   │   ├── pipeline/page.tsx         # Processing pipeline monitor
│   │   │   ├── growth/page.tsx           # Growth & funnels
│   │   │   ├── security/page.tsx         # Security & audit log
│   │   │   ├── insights/page.tsx         # AI insights feed
│   │   │   └── settings/page.tsx         # Admin settings
│   │   └── ...
│   └── api/
│       └── admin/
│           ├── stats/route.ts            # Aggregate stats
│           ├── users/route.ts            # User list (paginated, filterable)
│           ├── users/[id]/route.ts       # User detail + actions
│           ├── orders/route.ts           # Order list
│           ├── orders/[id]/route.ts      # Order detail + actions
│           ├── pipeline/route.ts         # Pipeline status
│           ├── insights/route.ts         # AI insights CRUD
│           ├── analysis/route.ts         # Trigger AI analysis
│           ├── audit-log/route.ts        # Audit log viewer
│           └── ...
├── components/
│   └── admin/
│       ├── AdminLayout.tsx               # Sidebar + topbar shell
│       ├── AdminSidebar.tsx              # Navigation sidebar
│       ├── StatCard.tsx                  # Metric card with trend
│       ├── DataTable.tsx                 # Sortable, filterable table
│       ├── Chart.tsx                     # Simple chart component
│       ├── InsightCard.tsx               # AI insight display
│       ├── InsightFeed.tsx               # Scrollable insight list
│       ├── TimeRangeSelector.tsx         # Date range picker
│       ├── StatusBadge.tsx               # Status indicators
│       └── AdminSearch.tsx               # Global search
└── lib/
    └── admin/
        ├── middleware.ts                 # Admin auth check
        ├── service.ts                    # Service role supabase client
        ├── queries.ts                    # Admin data aggregation queries
        ├── audit.ts                      # Audit logging helper
        └── ai/
            ├── analyzer.ts              # Claude API integration
            ├── aggregator.ts            # Data aggregation for AI
            ├── prompts.ts               # Analysis prompt templates
            └── scheduler.ts             # Cron-triggered analysis
```

---

## Phase 1: Foundation

**Goal**: Admin route group, auth, layout, middleware, service client, DB migration

### Database
- Migration: Add `role` column to `profiles`, create `admin_audit_log` table
- Set your user as admin: `UPDATE profiles SET role = 'admin' WHERE email = '<your-email>'`

### Middleware
- `src/lib/admin/middleware.ts` — helper that checks `role = 'admin'` via service role client
- Update `src/middleware.ts` — add `/admin` to protected routes, redirect non-admins to 404

### Admin API Auth Pattern
```typescript
// Every admin API route starts with:
import { requireAdmin } from '@/lib/admin/middleware';

export async function GET(request: NextRequest) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // ... admin logic using service role client
}
```

### Layout
- Dark mode by default (`.dark` class on admin layout)
- Sidebar navigation with sections: Home, Users, Photos, Rolls, Circles, Orders, Revenue, Pipeline, Growth, Security, Insights, Settings
- Top bar with: breadcrumbs, global search, notification bell, admin avatar
- Responsive: collapsible sidebar on mobile

### Service Client
- `src/lib/admin/service.ts` — creates Supabase client with `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS)
- All admin queries go through this client

### Audit Logging
- `src/lib/admin/audit.ts` — `logAdminAction(adminId, action, targetType, targetId, metadata)`
- Called in every admin mutation (tier change, order cancel, etc.)

---

## Phase 2: Home Dashboard & User Management

**Goal**: The vital signs dashboard + full user management

### Home Dashboard (`/admin`)
**Vital Signs Cards** (real-time):
- Total users (+ new today/this week)
- Total photos uploaded (+ today)
- Active rolls (building + processing + developed)
- Total orders (+ pending/in_production)
- Revenue MTD (from Stripe)
- Plus subscribers (count + MRR)
- Processing queue depth (pending jobs)
- Storage used (total bytes across all users)

**Trend Sparklines**: 7-day mini charts for key metrics

**Recent Activity Feed**: Last 20 actions (signups, uploads, orders, developments)

**AI Insights Panel**: Top 5 unacknowledged insights (from Phase 8)

### User Management (`/admin/users`)
**User List**:
- Paginated table (50/page)
- Columns: avatar, email, display_name, tier, photo_count, storage_used, rolls developed, orders placed, created_at
- Search by email/name
- Filter by: tier (free/plus), has_orders, active_last_7d, onboarding_complete
- Sort by: created_at, photo_count, storage_used

**User Detail** (`/admin/users/[id]`):
- Profile card: avatar, email, name, tier, created_at, last_active
- Stats: photos, rolls, orders, favorites, circles joined
- Activity timeline: uploads, roll developments, orders, tier changes
- Admin actions: Change tier (with audit log), add note, view as user (link to their profile)
- Rolls list: all rolls with status, photo count, film profile
- Orders list: all orders with status
- Storage breakdown: originals, thumbnails, processed

---

## Phase 3: Product Analytics

**Goal**: Deep visibility into photos, rolls, and circles

### Photo Analytics (`/admin/photos`)
- **Volume**: Total photos, uploads per day (chart), avg per user
- **Filter breakdown**: pie chart of filter_status (visible, filtered_auto, hidden_manual, pending)
- **Filter reasons**: bar chart of filter_reason (blur, screenshot, duplicate, exposure, document)
- **Aesthetic scores**: histogram distribution
- **Camera breakdown**: top camera_make/camera_model combinations
- **Scene classification**: tag cloud of scene labels
- **Storage**: total original size, total thumbnail size, avg photo size
- **Face detection**: avg face_count distribution

### Roll Analytics (`/admin/rolls`)
- **Status breakdown**: donut chart (building, ready, processing, developed, error)
- **Film profile popularity**: bar chart
- **Development velocity**: avg time from building → developed
- **Error rate**: % of rolls that hit error status
- **Photo count distribution**: histogram of photos per roll
- **Processing times**: avg processing duration chart over time
- **Roll Detail** (`/admin/rolls/[id]`): all photos, processing state, user info, timeline

### Circle Analytics (`/admin/circles`)
- **Total circles**, avg members per circle, most active circles
- **Post frequency**: posts per day chart
- **Engagement**: reactions per post, comments per post
- **Growth**: new circles per week, new members per week
- **Top circles**: by member count, by post count, by engagement

---

## Phase 4: Revenue & Orders

**Goal**: Full financial visibility and order management

### Order Management (`/admin/orders`)
- **Order list**: paginated, filterable by status
- Columns: id, user email, product, print_size, photo_count, total_cents, status, created_at
- Quick actions: view detail, cancel order
- **Status pipeline**: visual funnel (pending → submitted → in_production → shipped → delivered)
- **Order Detail** (`/admin/orders/[id]`): full order info, line items with photos, shipping info, Prodigi ID, tracking URL, timeline

### Revenue Dashboard (`/admin/revenue`)
- **MRR**: current monthly recurring revenue from Plus subscriptions
- **Revenue chart**: monthly revenue over time (subscriptions + one-time orders)
- **Subscription metrics**: total Plus users, churn rate, LTV estimate
- **Order revenue**: total print revenue, avg order value, orders per month
- **Free first roll**: count + cost tracking (free rolls fulfilled)
- **Stripe integration**: link to Stripe dashboard for each customer/subscription
- **ARPU**: avg revenue per user (paying and overall)

---

## Phase 5: Operations

**Goal**: Real-time visibility into system health

### Processing Pipeline (`/admin/pipeline`)
- **Queue dashboard**: pending, processing, completed, failed jobs (with counts)
- **Job list**: filterable by type (filter, develop, generate_thumbnail) and status
- **Processing throughput**: jobs/hour chart
- **Error log**: failed jobs with error_message, attempts, payload
- **Retry controls**: retry failed jobs, clear stuck jobs
- **Processing times**: p50, p95, p99 processing duration
- **Live status**: auto-refreshing (polling or SSE)

### Health Monitoring
- **External services**: Stripe API, Prodigi API, R2 storage, Resend email — last ping status
- **Cron job health**: last run time for cleanup-invites, cleanup-orphans, retry-jobs
- **Error rate**: errors from Sentry (surfaced via the captureError integration)
- **Storage health**: R2 bucket stats

---

## Phase 6: Growth & Marketing

**Goal**: Understand user acquisition, activation, retention

### Growth Dashboard (`/admin/growth`)
- **Signup funnel**: signups → onboarding_complete → first_upload → first_roll → first_order → plus_upgrade
  - Conversion rates between each step
  - Funnel visualization
- **Cohort retention**: weekly cohorts, % active at week 1, 2, 4, 8, 12
  - "Active" = uploaded photo or developed roll
  - Heat map visualization
- **Referral program**: total referrals sent, signed_up, converted, reward_granted
  - Top referrers
  - Referral conversion rate
- **Activation metrics**: time from signup to first upload, first roll, first order
- **User segments**: power users (10+ rolls), casual (1-2 rolls), dormant (no activity 30d)

---

## Phase 7: Security & Compliance

**Goal**: Audit trail, auth monitoring, data management

### Security Dashboard (`/admin/security`)
- **Audit log viewer**: searchable, filterable log of all admin actions
  - Filter by admin, action type, target type, date range
- **Auth monitoring**: recent signups, login patterns (from Supabase auth logs if accessible)
- **Suspicious activity**: accounts with rapid uploads, accounts with unusual patterns
- **Data management**:
  - User data export (GDPR)
  - User account deletion tool (cascade delete with confirmation)
  - Storage cleanup: orphaned files in R2

---

## Phase 8: AI Intelligence Layer (Claude Integration)

**Goal**: Claude proactively monitors everything and generates actionable insights

### Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Cron / Trigger  │────▶│  Aggregator  │────▶│ Claude API  │
│  (daily/weekly)  │     │ (build data) │     │ (analysis)  │
└─────────────────┘     └──────────────┘     └──────┬──────┘
                                                     │
                                               ┌─────▼──────┐
                                               │  Insights   │
                                               │  (stored)   │
                                               └─────┬──────┘
                                                     │
                                    ┌────────────────▼────────────────┐
                                    │  Dashboard + Email + Alerts     │
                                    └─────────────────────────────────┘
```

### Data Aggregation (`src/lib/admin/ai/aggregator.ts`)
Builds a structured JSON snapshot of the entire system state:
```typescript
interface SystemSnapshot {
  period: { start: Date; end: Date };
  users: {
    total: number; newThisPeriod: number; plusCount: number;
    churnedThisPeriod: number; activeLast7d: number;
    onboardingCompletionRate: number;
    segmentBreakdown: { power: number; casual: number; dormant: number };
  };
  photos: {
    total: number; uploadedThisPeriod: number;
    filterBreakdown: Record<string, number>;
    avgAestheticScore: number; storageUsedBytes: number;
  };
  rolls: {
    total: number; developedThisPeriod: number;
    statusBreakdown: Record<string, number>;
    filmProfilePopularity: Record<string, number>;
    avgProcessingTimeMins: number; errorRate: number;
  };
  orders: {
    total: number; newThisPeriod: number;
    statusBreakdown: Record<string, number>;
    revenueCentsThisPeriod: number; avgOrderValueCents: number;
    freeFirstRollCount: number;
  };
  circles: {
    total: number; newThisPeriod: number;
    avgMembers: number; postsThisPeriod: number;
    avgEngagementPerPost: number;
  };
  pipeline: {
    pendingJobs: number; failedJobs: number;
    avgProcessingTimeSecs: number;
    throughputJobsPerHour: number;
  };
  referrals: {
    totalSent: number; conversionRate: number;
    activeReferrers: number;
  };
  trends: {
    // Day-over-day and week-over-week comparisons
    signupsDelta: number;
    uploadsDelta: number;
    ordersDelta: number;
    revenueDelta: number;
    processingTimeDelta: number;
  };
}
```

### Claude Analysis (`src/lib/admin/ai/analyzer.ts`)
```typescript
export async function runAnalysis(
  type: 'daily_briefing' | 'weekly_deep_dive' | 'section_analysis',
  section?: string
): Promise<AdminInsight[]> {
  // 1. Aggregate data
  const snapshot = await buildSystemSnapshot(period);

  // 2. Build prompt with system context + data
  const prompt = buildAnalysisPrompt(type, snapshot, section);

  // 3. Call Claude API
  const response = await callClaude(prompt);

  // 4. Parse structured insights from response
  const insights = parseInsights(response);

  // 5. Store insights + analysis run in DB
  await storeInsights(insights);

  return insights;
}
```

### Prompt Engineering (`src/lib/admin/ai/prompts.ts`)
Carefully crafted prompts that give Claude full context:

**Daily Briefing Prompt**:
```
You are the AI operations analyst for Roll, a photo printing app.
Analyze today's data and produce actionable insights.

The app works like this: Users upload photos → AI filters out bad ones →
users build rolls of 36 photos → apply film profiles → develop → order prints.
Revenue comes from Plus subscriptions and print orders. First roll is free.

Here is today's system snapshot: {snapshot}

Produce 3-7 insights in this JSON format:
[{
  "type": "anomaly|growth|cost|security|performance|churn|revenue",
  "severity": "info|warning|critical",
  "section": "home|users|photos|rolls|orders|circles|pipeline|growth",
  "title": "Short headline (max 80 chars)",
  "body": "2-3 sentence explanation with specific numbers and a recommended action",
  "data": { /* relevant supporting data */ }
}]

Focus on: anomalies vs historical norms, actionable growth opportunities,
cost inefficiencies, churn risks, and revenue optimization.
```

**Weekly Deep Dive Prompt**: Includes week-over-week trends, cohort data, and asks for strategic recommendations.

**Section-Specific Prompt**: When admin clicks "Analyze" on any section, sends that section's detailed data for focused analysis.

### Insight Types & Examples

| Type | Example |
|------|---------|
| **Anomaly** | "Photo uploads dropped 43% today (127 vs 7-day avg of 223). Check if upload API has errors." |
| **Growth** | "Users who develop 2+ rolls upgrade to Plus at 4.2x the rate of 1-roll users. Consider a nudge after first development." |
| **Cost** | "Free first roll orders cost $847 this month but only 12% converted to Plus. ROI is negative — consider tightening eligibility." |
| **Security** | "User abc@example.com uploaded 2,400 photos in 3 hours, consuming 8.2GB. Possible abuse — investigate." |
| **Performance** | "Processing queue has 47 pending jobs. Avg wait time hit 18 minutes (vs normal 3 min). Check for stuck workers." |
| **Churn** | "8 Plus subscribers haven't opened the app in 14+ days. Consider a re-engagement email with their best photos." |
| **Revenue** | "Average order value is $24.50 but 73% of orders are 4x6 only. Promoting 5x7 could increase AOV by ~30%." |

### Scheduled Analysis (Cron)
- **Daily** (8am): Full daily briefing, stored as insights, optional email summary
- **Weekly** (Monday 8am): Deep dive with cohort analysis, strategic recommendations
- **On-demand**: Admin clicks "Run Analysis" on any section or from insights page

### Insight Presentation
- **Home dashboard**: Top 5 unacknowledged insights with severity badges
- **Each section**: "AI Insights" collapsible panel with section-specific insights
- **Insights page** (`/admin/insights`): Full feed, filterable by type/severity/section, acknowledge/dismiss
- **Email briefing**: Daily digest email to admin via Resend

---

## Phase 9: Alerts & Notifications

**Goal**: Proactive alerting when things need attention

### Alert Rules (initially hardcoded, then configurable)
- Processing queue > 20 pending jobs
- Error rate > 5% in last hour
- Zero signups in 24 hours
- Revenue drop > 30% week-over-week
- Storage growth > 10GB in a day
- Failed payment (from Stripe webhook)
- AI-generated critical severity insight

### Notification Channels
- **In-app**: Badge on bell icon in admin topbar, notification drawer
- **Email**: Critical alerts sent immediately via Resend
- **Push**: Web push notifications via existing push infrastructure

### Alert History
- All triggered alerts stored in DB
- Alert list page with acknowledge/resolve actions

---

## Implementation Phases (Build Order)

### Phase 1: Foundation (BUILD FIRST)
1. DB migration (role column, audit_log table)
2. `src/lib/admin/service.ts` — service role client
3. `src/lib/admin/middleware.ts` — requireAdmin helper
4. Update `src/middleware.ts` — protect `/admin` routes
5. `src/lib/admin/audit.ts` — audit logging
6. `src/components/admin/AdminLayout.tsx` — sidebar + topbar
7. `src/components/admin/AdminSidebar.tsx` — navigation
8. `src/app/(admin)/layout.tsx` — route group layout
9. `src/app/(admin)/admin/page.tsx` — placeholder home

### Phase 2: Home Dashboard + Users
1. `src/app/api/admin/stats/route.ts` — aggregate metrics API
2. `src/components/admin/StatCard.tsx` — metric card component
3. `src/app/(admin)/admin/page.tsx` — vital signs dashboard
4. `src/components/admin/DataTable.tsx` — reusable data table
5. `src/app/api/admin/users/route.ts` — user list API
6. `src/app/api/admin/users/[id]/route.ts` — user detail + actions API
7. `src/app/(admin)/admin/users/page.tsx` — user list
8. `src/app/(admin)/admin/users/[id]/page.tsx` — user detail

### Phase 3: Product Analytics
1. `src/app/api/admin/photos/route.ts` — photo analytics API
2. `src/app/(admin)/admin/photos/page.tsx` — photo analytics
3. `src/app/api/admin/rolls/route.ts` — roll analytics API
4. `src/app/(admin)/admin/rolls/page.tsx` — roll analytics
5. `src/app/(admin)/admin/rolls/[id]/page.tsx` — roll detail
6. `src/app/api/admin/circles/route.ts` — circle analytics API
7. `src/app/(admin)/admin/circles/page.tsx` — circle analytics

### Phase 4: Revenue & Orders
1. `src/app/api/admin/orders/route.ts` — order list API
2. `src/app/api/admin/orders/[id]/route.ts` — order detail + actions
3. `src/app/(admin)/admin/orders/page.tsx` — order management
4. `src/app/(admin)/admin/orders/[id]/page.tsx` — order detail
5. `src/app/api/admin/revenue/route.ts` — revenue metrics
6. `src/app/(admin)/admin/revenue/page.tsx` — revenue dashboard

### Phase 5: Operations
1. `src/app/api/admin/pipeline/route.ts` — pipeline status API
2. `src/app/(admin)/admin/pipeline/page.tsx` — pipeline monitor
3. Health check endpoints for external services
4. Error dashboard (aggregated from processing_jobs)

### Phase 6: Growth & Marketing
1. `src/app/api/admin/growth/route.ts` — funnel + cohort data
2. `src/app/(admin)/admin/growth/page.tsx` — growth dashboard
3. Cohort retention calculation logic
4. Referral analytics

### Phase 7: Security & Compliance
1. `src/app/api/admin/audit-log/route.ts` — audit log API
2. `src/app/(admin)/admin/security/page.tsx` — security dashboard
3. User data export tool
4. Account deletion tool

### Phase 8: AI Intelligence Layer
1. DB migration: `admin_insights`, `admin_analysis_runs` tables
2. `src/lib/admin/ai/aggregator.ts` — system snapshot builder
3. `src/lib/admin/ai/prompts.ts` — analysis prompt templates
4. `src/lib/admin/ai/analyzer.ts` — Claude API integration
5. `src/app/api/admin/analysis/route.ts` — trigger analysis API
6. `src/app/api/admin/insights/route.ts` — insights CRUD API
7. `src/app/api/cron/admin-daily-briefing/route.ts` — daily cron
8. `src/app/api/cron/admin-weekly-analysis/route.ts` — weekly cron
9. `src/components/admin/InsightCard.tsx` — insight display
10. `src/components/admin/InsightFeed.tsx` — insight feed
11. `src/app/(admin)/admin/insights/page.tsx` — insights page
12. Integrate insight panels into all section pages
13. Daily briefing email template

### Phase 9: Alerts & Notifications
1. DB: alerts table (or extend insights)
2. Alert rule engine
3. In-app notification bell + drawer
4. Email alerts for critical issues
5. Alert history page

---

## Design Decisions

1. **Dark mode default**: Admin uses `.dark` class — the darkroom theme suits a monitoring dashboard
2. **No external chart library initially**: Use CSS-based charts (bar charts as flex divs, sparklines as SVG paths) to avoid bundle bloat. Can add Recharts later if needed.
3. **Server Components**: All admin pages are Server Components by default (data fetching at render time). Client Components only for interactive elements (search, filters, date pickers).
4. **Polling for real-time**: Admin pages poll every 30s for fresh data. No WebSocket complexity needed.
5. **Service role client**: All admin queries bypass RLS using the service role key. This is intentional — admins need cross-user visibility.
6. **Claude API cost management**: Daily briefing ~$0.05-0.10/day, weekly deep dive ~$0.20/week. On-demand analysis budgeted per-click. Total estimated: <$10/month.
7. **Audit everything**: Every admin mutation is logged. No silent changes.
