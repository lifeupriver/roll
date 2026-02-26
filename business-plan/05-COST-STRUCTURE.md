# 05 — Cost Structure & Financial Projections Seed

> This document maps every cost category — fixed, variable, and scaling — with specific numbers for financial modeling. Use these as inputs for a spreadsheet model.

---

## Cost Categories Overview

| Category | Type | Scales With |
|----------|------|------------|
| Infrastructure (hosting, database, storage) | Semi-fixed + variable | Users + photos stored |
| Image processing (eyeQ API) | Variable | Photos developed |
| Print fulfillment (Prodigi) | Variable (COGS) | Print orders |
| Payment processing (Stripe) | Variable | Revenue collected |
| Email (Resend) | Variable | Users + notifications |
| Analytics (PostHog) | Semi-fixed | Events tracked |
| Error tracking (Sentry) | Semi-fixed | Errors + transactions |
| Team / Salaries | Fixed | Stage of company |
| Marketing / Acquisition | Variable | Growth targets |
| Legal / Compliance | Fixed | Jurisdictions served |

---

## Detailed Cost Breakdown

### 1. Infrastructure Costs

#### Vercel (Hosting & Compute)
| Tier | Monthly Cost | Included | When to Upgrade |
|------|-------------|---------|----------------|
| Pro | $20/month | 1M function invocations, 100GB bandwidth, 300s timeouts | Current (prototype through ~10K users) |
| Enterprise | $500+/month | Unlimited invocations, priority support, SLA | 50K+ users or when SLA matters |

**Scaling notes:**
- Serverless functions scale automatically; cost is per invocation + duration
- Most expensive function: photo processing (Sharp LUT application) — ~2-5s per invocation
- 36 photos per roll × 5s average = ~180s compute per roll developed
- At $0.000018/GB-s (Vercel pricing), 36-photo roll = ~$0.003 in compute
- Major cost is NOT compute — it's the function timeout requirement (300s for batch processing)

#### Supabase (Database + Auth)
| Tier | Monthly Cost | Included | When to Upgrade |
|------|-------------|---------|----------------|
| Free | $0 | 500MB DB, 1GB storage, 50K MAU auth | Development only |
| Pro | $25/month | 8GB DB, 100GB storage, unlimited auth | Prototype through ~25K users |
| Team | $599/month | Priority support, SOC2, more connections | 25K-200K users |
| Enterprise | Custom | Dedicated infra, SLA | 200K+ users |

**Scaling notes:**
- Database size grows ~1KB per photo (metadata only — images in R2)
- At 500K users × 500 photos avg = 250M rows × 1KB = ~250GB database → Enterprise tier
- Connection pooling critical past 10K concurrent users
- Realtime subscriptions (roll processing status) cost per connection

#### Cloudflare R2 (Photo Storage)
| Component | Cost | Notes |
|-----------|------|-------|
| Storage | $0.015/GB/month | Zero egress fees (this is why R2 was chosen) |
| Class A operations (writes) | $4.50/million | Uploads, processing writes |
| Class B operations (reads) | $0.36/million | Photo viewing, thumbnail loads |

**Storage scaling model:**

| Users | Avg Photos | Avg File Size | Storage | Monthly Cost |
|-------|-----------|--------------|---------|-------------|
| 1,000 | 500 | 3MB (original) + 0.5MB (thumb) + 3MB (processed) | ~3.25 TB | ~$49 |
| 10,000 | 500 | 6.5MB total | ~32.5 TB | ~$488 |
| 100,000 | 500 | 6.5MB total | ~325 TB | ~$4,875 |
| 500,000 | 500 | 6.5MB total | ~1.6 PB | ~$24,375 |

**Key insight:** R2's zero egress is critical. With a photo-heavy app, egress costs on AWS S3 would be 5-10x higher. At 500K users viewing photos regularly, S3 egress could exceed $50K/month vs. $0 on R2.

### 2. Image Processing Costs (eyeQ / Perfectly Clear)

| Phase | Cost Per Photo | Notes |
|-------|---------------|-------|
| Prototype (Web API) | $0.02-$0.05 | Cloud API, volume-dependent pricing |
| Post-prototype (Self-hosted Docker) | ~$0.005-$0.01 | One-time license + infrastructure |

**Processing cost scaling:**

| Monthly Active Rolls | Photos Processed | Cost (API) | Cost (Self-hosted) |
|---------------------|-----------------|-----------|-------------------|
| 500 | 18,000 | $360-$900 | $90-$180 |
| 5,000 | 180,000 | $3,600-$9,000 | $900-$1,800 |
| 50,000 | 1,800,000 | $36,000-$90,000 | $9,000-$18,000 |
| 200,000 | 7,200,000 | $144,000-$360,000 | $36,000-$72,000 |

**Critical decision point:** Self-hosted eyeQ Docker deployment is essential before scaling past ~10K monthly rolls. The API cost is the single largest variable cost and reduces 4-5x with self-hosting.

**Self-hosted infrastructure estimate:**
- GPU instance (for batch processing): ~$500-$1,500/month
- eyeQ Docker license: negotiated (likely $5K-$20K/year)
- Total: ~$1,000-$3,000/month for capacity to process 50K+ rolls/month

### 3. Print Fulfillment Costs (Prodigi)

| Product | Production Cost | Domestic Shipping | Total COGS |
|---------|---------------|-------------------|-----------|
| 36 × 4×6 prints | ~$4.50 | ~$3.00 | ~$7.50 |
| 36 × 5×7 prints | ~$7.00 | ~$4.50 | ~$11.50 |
| Hardcover book (24 pages) | ~$12.00 | ~$5.00 | ~$17.00 |
| Hardcover book (48 pages) | ~$18.00 | ~$7.00 | ~$25.00 |
| Magazine (24 pages) | ~$4.50 | ~$3.00 | ~$7.50 |
| International shipping add-on | N/A | +$3.00-$8.00 | Variable |

**Free first roll cost:**
| Metric | Value |
|--------|-------|
| Cost per free roll | ~$12-$15 |
| If 25K users sign up, 80% develop first roll | 20,000 free rolls |
| Total free roll cost (Year 1) | $240K-$300K |

**This is the largest upfront cost and should be modeled as Customer Acquisition Cost.**

### 4. Payment Processing (Stripe)

| Component | Rate |
|-----------|------|
| Transaction fee | 2.9% + $0.30 per charge |
| Subscription billing | Same rate |
| Refunds | Fee not returned |

**Example on $4.99 subscription:**
- Stripe fee: $0.14 + $0.30 = $0.44
- Net to Roll: $4.55
- **Effective rate on $4.99: 8.8%**

**Example on $12.99 print order:**
- Stripe fee: $0.38 + $0.30 = $0.68
- Net to Roll: $12.31
- **Effective rate on $12.99: 5.2%**

*Higher-value transactions have lower effective Stripe rates. Bundling orders or annual billing reduces payment overhead.*

### 5. Email (Resend)

| Tier | Monthly Cost | Emails/Month |
|------|-------------|-------------|
| Free | $0 | 100/day (3,000/month) |
| Pro | $20/month | 50,000/month |
| Business | $95/month | 200,000/month |
| Enterprise | Custom | Unlimited |

**Email volume estimates:**
- Per user/month: ~3 emails (magic link, roll developed, promotional)
- 10K users: ~30K emails → Pro tier ($20/month)
- 100K users: ~300K emails → Enterprise (negotiated)

### 6. Analytics (PostHog)

| Tier | Monthly Cost | Events/Month |
|------|-------------|-------------|
| Free | $0 | 1M events |
| Growth | ~$0.000345/event beyond 1M | Scales with usage |

**Event volume estimates:**
- Per active user/month: ~200 events (page views, clicks, uploads, etc.)
- 10K MAU: ~2M events → ~$345/month
- 100K MAU: ~20M events → ~$6,555/month

### 7. Error Tracking (Sentry)

| Tier | Monthly Cost | Events/Month |
|------|-------------|-------------|
| Developer | $0 | 5K events |
| Team | $26/month | 50K events |
| Business | $80/month | 100K events |

---

## Fixed Operating Costs

### Team / Salaries (Pre-Revenue to Seed Stage)

| Role | Timing | Estimated Annual Cost | Notes |
|------|--------|----------------------|-------|
| Founder / CEO | Day 0 | $0-$80K (below market) | Equity-heavy compensation |
| Full-stack engineer | Year 1 Q2 | $120K-$180K | First hire; mobile + web |
| Designer / colorist | Contract | $5K-$15K total | LUT creation, brand refinement |
| Marketing lead | Year 1 Q3 | $90K-$130K | Growth, content, partnerships |
| Customer support | Year 1 Q4 | $45K-$65K | Part-time initially |

**Year 1 team cost estimate:** $200K-$400K (lean, founder-led)
**Year 2 team cost estimate:** $500K-$800K (small team, 4-6 people)
**Year 3 team cost estimate:** $1M-$1.5M (growth team, 8-12 people)

### Legal / Compliance

| Item | Cost | Frequency |
|------|------|-----------|
| Terms of Service / Privacy Policy (attorney) | $3K-$8K | Once + annual review |
| GDPR/CCPA compliance audit | $5K-$10K | Annual |
| Trademark (ROLL) | $2K-$5K | Once |
| Business incorporation + accounting | $3K-$8K/year | Annual |
| App Store legal (iOS launch) | $99/year | Annual |

### Software & Tools

| Tool | Monthly Cost | Purpose |
|------|-------------|---------|
| GitHub (Team) | $4/user/month | Source control |
| Figma | $15/user/month | Design |
| Linear / project management | $10/user/month | Task tracking |
| Notion / docs | $10/user/month | Documentation |
| Domain (roll.photos) | $15/year | Brand domain |
| **Total (small team)** | **~$100-$200/month** | |

---

## Cost Scaling Model

### Monthly Cost at Scale Milestones

| Cost Category | 1K Users | 10K Users | 100K Users | 500K Users |
|---------------|---------|----------|-----------|-----------|
| Vercel | $20 | $20 | $200 | $500+ |
| Supabase | $25 | $25 | $599 | Custom |
| R2 storage | $49 | $488 | $4,875 | $24,375 |
| eyeQ (API) | $360 | $3,600 | $36,000 | N/A |
| eyeQ (self-hosted) | N/A | N/A | $3,000 | $12,000 |
| Resend | $0 | $20 | $95 | Custom |
| PostHog | $0 | $345 | $6,555 | $32,000 |
| Sentry | $0 | $26 | $80 | $200 |
| Stripe fees | $220 | $2,200 | $22,000 | $110,000 |
| **Total infra/variable** | **~$674** | **~$6,724** | **~$73,404** | **~$179,075** |
| Print COGS (est.) | $1,000 | $10,000 | $100,000 | $500,000 |
| Free roll CAC | $12,000 | $120,000 | $1,200,000 | N/A (capped) |
| Team salaries | $15K | $25K | $60K | $100K |
| **Total monthly** | **~$29K** | **~$162K** | **~$1.43M** | **~$779K** |

*Note: Free roll CAC is front-loaded and caps once the program is modified (e.g., limited to first 100K users or requires email verification). At 500K users, assume free roll program is limited/sunset.*

---

## Breakeven Analysis

### Breakeven per Subscriber

| Revenue | Amount |
|---------|--------|
| Roll+ subscription | $4.99/month |
| Minus Stripe | -$0.44 |
| Minus eyeQ (2 rolls, self-hosted) | -$0.72 |
| Minus infrastructure (prorated) | -$0.15 |
| **Net margin per subscriber** | **$3.68/month** |

**With print orders (avg 0.8 orders/month × $12.99):**
| Revenue | Amount |
|---------|--------|
| Total revenue | $15.38/month |
| Minus all variable costs | -$10.50 |
| **Net margin per active subscriber** | **$4.88/month** |

### Company-Level Breakeven

**At ~$50K/month fixed costs (small team + overhead):**

| Scenario | Subscribers Needed | Total Users (at 8% conversion) |
|----------|-------------------|-------------------------------|
| Subs only | ~13,600 | ~170,000 |
| Subs + prints | ~10,200 | ~128,000 |
| Subs + prints + books | ~8,500 | ~106,000 |

**Estimated time to breakeven: 18-24 months from launch** (base case)

---

## Sensitivity Variables for Financial Model

These are the key levers that most impact financial outcomes. Build scenarios around them:

| Variable | Low | Base | High | Impact |
|----------|-----|------|------|--------|
| Monthly user growth rate | 8% | 15% | 25% | Compounds → massive revenue difference |
| Free-to-paid conversion | 5% | 8% | 12% | Direct MRR impact |
| Monthly subscriber churn | 7% | 5% | 3% | Compounds → massive LTV difference |
| Print attach rate | 30% | 45% | 60% | Biggest margin lever |
| eyeQ cost per photo | $0.05 | $0.03 | $0.01 | Determines processing margin |
| Free roll redemption rate | 90% | 80% | 60% | Controls CAC spend |
| Average order value | $13 | $17 | $22 | Revenue per transaction |

---

## Funding Requirements

### Pre-Seed / Bootstrap (Current)
- **Need:** $0-$50K
- **Use:** Infrastructure costs, free roll program (first 500-1,000 users), design contractor
- **Source:** Founder capital, friends & family

### Seed Round
- **Need:** $500K-$1.5M
- **Use:** First 2 hires, free roll program at scale (10K-25K users), iOS development, marketing budget
- **Runway:** 12-18 months
- **Metrics needed:** 1,000+ paying subscribers, >5% conversion rate, >$10K MRR, strong NPS

### Series A
- **Need:** $3M-$8M
- **Use:** Team to 10-15 people, iOS launch, aggressive marketing, international expansion
- **Runway:** 18-24 months
- **Metrics needed:** $100K+ MRR, 20K+ subscribers, clear path to breakeven, strong unit economics

---

## Key Financial Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|-----------|
| eyeQ costs don't reduce with self-hosting | Margin compression | Low | Multiple color correction alternatives; can build in-house |
| Free roll program is too expensive at scale | Burns cash faster than planned | Medium | Cap at N users, require email verification, AB test removal |
| Churn exceeds 7%/month | Can't build subscriber base | Medium | Focus on print habit; physical products reduce churn |
| Stripe increases rates | Margin compression | Low | Negotiate volume discounts; consider alternatives at scale |
| R2 pricing changes | Storage costs spike | Very Low | R2 is strategically priced to compete with S3; unlikely to increase |
| Print costs increase (Prodigi) | COGS rises, margin shrinks | Medium | Multi-vendor strategy; negotiate volume pricing |
| Users upload but don't convert | High free tier cost, low revenue | Medium | Optimize conversion funnel; limit free tier more aggressively |
