# Roll — Startup Launch Checklist

Everything needed beyond the app code to successfully launch and scale Roll as a business.

---

## 1. Infrastructure & DevOps

### CI/CD Pipeline
- [ ] **GitHub Actions workflow** — Run lint + tests on every PR
- [ ] **Preview deployments** — Vercel preview for every branch (built-in)
- [ ] **Production deploy gate** — Require passing CI before merge to main
- [ ] **Branch protection rules** — Require PR reviews, no direct push to main
- [ ] **Staging environment** — Separate Vercel project with test Stripe/Supabase credentials
- [ ] **Seed data script** — Add environment guard to `/api/seed` (currently exposed in production)

### Database
- [ ] **Supabase Pro plan** — For production SLA, daily backups, and connection pooling
- [ ] **Database migrations** — Version-controlled schema migrations (Supabase CLI or Prisma)
- [ ] **Point-in-time recovery** — Enable PITR for the production database
- [ ] **Read replicas** — Consider when read traffic exceeds single instance capacity
- [ ] **Connection pooling** — PgBouncer via Supabase (enabled on Pro)

### Storage
- [ ] **R2 lifecycle rules** — Auto-delete orphaned uploads after 24 hours
- [ ] **Backup strategy** — R2 doesn't have built-in backups; consider cross-region replication
- [ ] **CDN cache headers** — Set appropriate Cache-Control on photo assets (immutable for content-hashed files)

### Monitoring & Alerting
- [ ] **Uptime monitoring** — Vercel Analytics, or external (Better Uptime, Checkly)
- [ ] **Sentry alerts** — Configure alert rules for error spikes, P0 issues go to PagerDuty/Slack
- [ ] **Stripe webhook monitoring** — Alert on failed webhook deliveries
- [ ] **Database alerts** — Connection count, slow queries, disk usage approaching limits
- [ ] **R2 storage alerts** — Monitor storage growth and egress costs
- [ ] **PostHog dashboards** — Funnel conversion, daily active users, retention cohorts

---

## 2. Legal & Compliance

### Privacy & Data
- [ ] **Privacy Policy** — What data you collect, how you use it, third-party processors (Supabase, Stripe, Cloudflare, Sentry, PostHog)
- [ ] **Terms of Service** — Usage terms, content ownership, liability limitations
- [ ] **Cookie consent banner** — Required for EU users (PostHog, Sentry cookies)
- [ ] **GDPR compliance** — Data export, data deletion, right to be forgotten
- [ ] **CCPA compliance** — California consumer privacy rights
- [ ] **Data Processing Agreements** — With Supabase, Cloudflare, Stripe, PostHog, Sentry
- [ ] **Photo content policy** — Define prohibited content, CSAM detection obligations

### Business
- [ ] **Business entity** — LLC, C-Corp, etc.
- [ ] **EIN / Tax ID** — For Stripe payouts and tax filing
- [ ] **Business bank account** — Connected to Stripe
- [ ] **Stripe Atlas** — Consider for one-stop incorporation + Stripe setup
- [ ] **Sales tax / VAT** — Stripe Tax or a service like TaxJar for physical goods (prints)
- [ ] **Terms for print orders** — Return/refund policy, shipping disclaimers

---

## 3. Security Hardening

### Authentication
- [ ] **Rate limit login attempts** — Already done for billing; add to auth endpoints
- [ ] **Account lockout** — After N failed attempts, require email verification
- [ ] **Session management** — Configure session expiry in Supabase (default 1 hour)
- [ ] **Password requirements** — Minimum length/complexity in Supabase settings

### Application
- [ ] **Seed endpoint disabled in production** — Add `NODE_ENV` guard (Critical: currently unguarded)
- [ ] **Dependency audit** — Run `npm audit` and fix critical vulnerabilities
- [ ] **Content Security Policy** — Already configured; test with CSP Evaluator
- [ ] **Penetration test** — Before handling real money, hire a security firm or do a bug bounty

### Secrets Management
- [ ] **Rotate credentials** — After any developer offboarding
- [ ] **Vercel environment variables** — Use "Sensitive" flag for secret keys
- [ ] **No secrets in code** — Audit for any hardcoded credentials (`.env` files in `.gitignore`)
- [ ] **Separate credentials per environment** — Dev, staging, production all use different keys

---

## 4. Payment Operations

### Stripe Production Readiness
- [ ] **Activate Stripe account** — Complete identity verification, add bank account
- [ ] **Switch from test to live keys** — Update all `pk_test_` / `sk_test_` to `pk_live_` / `sk_live_`
- [ ] **Create production webhook endpoint** — New signing secret for production
- [ ] **Set up Stripe Radar** — Fraud detection rules
- [ ] **Configure tax collection** — Stripe Tax for subscription + print orders
- [ ] **Set up receipts** — Stripe auto-generates, but customize branding
- [ ] **Refund workflow** — Build admin UI or use Stripe Dashboard

### Print Fulfillment (Prodigi)
- [ ] **Switch to Prodigi production API** — `ENABLE_PRINT_FULFILLMENT=true`
- [ ] **Order test prints** — Verify quality, packaging, and shipping times
- [ ] **Set up tracking email** — Auto-email customers when prints ship (template exists)
- [ ] **Define SLA expectations** — Communicate estimated delivery times to users
- [ ] **Handle failed prints** — Workflow for reprints, refunds on quality issues

### Pricing Strategy
- [ ] **Roll+ subscription price** — Validate against competitor pricing
- [ ] **Print pricing** — Current: $0.30/4x6, $0.75/5x7 + $4.99 shipping — verify margins
- [ ] **Free first roll promotion** — Already built; decide if launching with it
- [ ] **Referral program** — Already built; define reward amounts

---

## 5. Email & Communications

### Transactional Email
- [ ] **Resend domain verification** — Verify `roll.photos` domain, set up SPF/DKIM/DMARC
- [ ] **Email templates** — Already built: magic link, roll developed, circle invite, referral, print shipped
- [ ] **Test deliverability** — Send test emails, check spam scores (mail-tester.com)
- [ ] **Email warmup** — Start with low volume, gradually increase to build sender reputation

### User Communication
- [ ] **Welcome email** — After signup, explain the app and first steps
- [ ] **Onboarding flow** — In-app onboarding is built; ensure it guides users to upload first photos
- [ ] **Push notification strategy** — When to send: roll developed, circle activity, order shipped
- [ ] **Email preferences** — Let users unsubscribe from non-essential emails (CAN-SPAM)

---

## 6. App Store & Distribution

### PWA (Current)
- [ ] **Web manifest** — Verify `manifest.json` with app name, icons, theme color
- [ ] **Service worker** — For offline support and push notifications
- [ ] **Install prompt** — Add "Add to Home Screen" prompt for mobile users
- [ ] **App icons** — Full set of icon sizes (192x192, 512x512, maskable)
- [ ] **Splash screens** — For iOS and Android PWA installs

### Native Apps (Capacitor — Pre-configured)
- [ ] **iOS app** — The codebase has Capacitor configured but not built
- [ ] **Android app** — Same Capacitor setup
- [ ] **Apple Developer account** ($99/year) — Required for App Store
- [ ] **Google Play Developer account** ($25 one-time) — Required for Play Store
- [ ] **App Store screenshots** — 6.5" and 5.5" iPhone, iPad, Android
- [ ] **App Store description** — ASO-optimized listing
- [ ] **Privacy nutrition labels** — Required for App Store submission
- [ ] **Deep links** — Handle `roll.photos/*` URLs opening in the native app
- [ ] **Push notification certificates** — APNs for iOS, FCM for Android

---

## 7. Growth & Marketing

### Pre-Launch
- [ ] **Landing page** — The root `/` route; ensure it communicates the value proposition
- [ ] **Waitlist or beta signup** — If doing a controlled launch
- [ ] **Social media accounts** — Instagram, Twitter/X, TikTok for a photo app
- [ ] **Press kit** — Logo, screenshots, founder story, product description
- [ ] **Product Hunt launch** — Prepare assets and a team to engage on launch day

### Analytics & Metrics
- [ ] **PostHog dashboards** — Key metrics:
  - DAU/MAU ratio (engagement)
  - Upload → Roll → Develop → Print funnel (conversion)
  - Free → Roll+ upgrade rate (monetization)
  - Circle creation and invite acceptance (virality)
  - Retention cohorts (7-day, 30-day)
- [ ] **Revenue metrics** — MRR, ARPU, churn rate (from Stripe)
- [ ] **Unit economics** — Print order margin, customer acquisition cost, lifetime value

### Growth Levers (Built into the App)
- [ ] **Referral program** — Already built; activate and promote
- [ ] **Circles (social)** — Viral loop: invite friends to share photos
- [ ] **Free first roll** — Acquisition hook already built
- [ ] **Year in Review** — Shareable content already built

---

## 8. Customer Support

### Tools
- [ ] **Support email** — `help@roll.photos` or use a tool like Intercom/Crisp
- [ ] **FAQ/Help center** — Common questions: uploading, developing rolls, print orders
- [ ] **In-app feedback** — Add a feedback button or use a tool like Canny
- [ ] **Bug reporting** — Sentry captures errors; add user-facing bug report flow

### Processes
- [ ] **Escalation path** — Who handles billing issues? Print quality complaints?
- [ ] **Refund policy** — Document and communicate clearly
- [ ] **Response time SLA** — Set expectations (e.g., 24-hour response for email)

---

## 9. Operational Readiness

### Runbooks
- [ ] **Incident response** — What to do when the site goes down
- [ ] **Stripe webhook failures** — How to replay missed events
- [ ] **Database issues** — How to investigate and resolve slow queries
- [ ] **Storage issues** — What to do if R2 is unreachable
- [ ] **Deployment rollback** — How to revert a bad deploy (Vercel instant rollback)

### Scaling Considerations
- [ ] **Rate limiting** — Currently in-memory (per-instance). Upgrade to Redis for multi-instance consistency
- [ ] **Image processing** — Currently in Vercel functions (300s timeout). Consider offloading to a queue (Inngest, Trigger.dev) for reliability
- [ ] **Background jobs** — Job table exists; wire up a cron poller or use a managed queue
- [ ] **Database connection limits** — Supabase Pro includes PgBouncer; monitor connection usage
- [ ] **CDN caching** — Ensure thumbnails and processed images are served from R2/CDN, not through Vercel functions

---

## 10. Launch Sequence

### Week -2: Final Prep
1. Complete all "Required" items above
2. Run full test suite (`npm test` — 191 tests)
3. Do a manual QA pass of the critical path: signup → upload → develop → print → pay
4. Verify all webhook integrations end-to-end
5. Test on real devices (iPhone, Android, desktop)

### Week -1: Soft Launch
1. Deploy to production with real credentials
2. Invite 10-20 beta testers (friends, family)
3. Monitor Sentry for errors, PostHog for usage patterns
4. Verify print orders flow end-to-end with real prints
5. Collect feedback, fix critical issues

### Launch Day
1. Announce on social media, Product Hunt, Hacker News
2. Monitor dashboards: signups, errors, Stripe, server load
3. Have the team online and responsive for the first 48 hours
4. Celebrate

### Week +1: Stabilize
1. Review all Sentry errors from launch traffic
2. Analyze PostHog funnels — where are users dropping off?
3. Address feedback from first users
4. Plan iteration based on real usage data
