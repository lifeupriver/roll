# 04 — Revenue Model & Unit Economics

> This document contains all the numbers, assumptions, and formulas needed to build a financial model for Roll. Use it to populate a spreadsheet with revenue projections, unit economics, and sensitivity analyses.

---

## Revenue Streams Overview

Roll has a **dual-revenue model**: recurring subscriptions (MRR) + transaction-based physical product sales. This is intentional — subscriptions provide predictable revenue, while physical products provide high-margin transactional revenue that grows with engagement.

| Stream | Type | Revenue Per Event | Frequency |
|--------|------|------------------|-----------|
| Roll+ subscription | Recurring | $4.99/month | Monthly |
| Roll Business subscription | Recurring | $9.99/month (planned) | Monthly |
| Print orders (roll prints) | Transactional | $12.99 per order | Per roll developed |
| Print orders (individual) | Transactional | $1.99-$3.99 per print | On demand |
| Hardcover books | Transactional | $29.99-$49.99 per book | Seasonal/milestone |
| Magazines | Transactional | $9.99-$14.99 per magazine (planned) | Monthly/quarterly |
| Magazine subscription | Recurring | $9.99/month (planned) | Monthly |
| Print subscription | Recurring | $11.99/month (planned) | Monthly |

---

## Subscription Tiers

### Free Tier ($0)
**Purpose:** Acquisition. Get users into the product, prove the value, drive them toward conversion.

| Feature | Limit |
|---------|-------|
| Photo upload + filtering | Unlimited |
| Content modes (All, People, Landscapes) | All |
| Manual hide | Unlimited |
| Checkmarking + roll building | Unlimited |
| Film profiles | Warmth only (1 of 6) |
| Cloud processing | First roll free |
| Cloud backup | 100 photos |
| Favorites | View only |
| Circle | Join + view only |
| Print sizes | 4×6 only |
| First roll of prints | FREE (36 4×6, no credit card) |

**Conversion Triggers:**
- User develops first roll with Warmth → sees other 5 profiles locked → "Roll+ members get all 6 film stocks"
- User tries to create a Circle → "Create circles with Roll+"
- User exceeds 100-photo backup limit → "Roll+ backs up your entire library"
- User wants to print Favorites as an album → "Album printing is a Roll+ feature"

### Roll+ ($4.99/month)
**Purpose:** Core revenue driver. The subscription that unlocks the full experience.

| Feature | Access |
|---------|--------|
| All 6 film profiles | Unlocked |
| Cloud processing | Unlimited rolls |
| Cloud backup | Unlimited, full resolution |
| Favorites | Full access (album printing, sharing) |
| Circle | Create, manage, share |
| Print sizes | 4×6 and 5×7 |
| Album printing from Favorites | Unlocked |
| Video/reel processing | Standard (3 min) + Feature (5 min) |
| Book creation | Unlocked |

**Pricing Rationale:** $4.99/month is:
- Below the "mental threshold" for subscription fatigue (~$5)
- Competitive with iCloud ($2.99 for 200GB) and Google One ($2.99 for 100GB)
- More expensive than basic storage (justified by processing + film profiles + printing + social)
- Annual option at $47.99/year ($3.99/month equivalent) for committed users

### Roll Business ($9.99/month — Planned)
**Purpose:** Revenue expansion. Higher-ARPU tier for business users.

| Feature | Access |
|---------|--------|
| Everything in Roll+ | Included |
| Public portfolio page (roll.photos/[username]) | Unlocked |
| Blog posts with photos | Unlocked |
| Batch film stock processing | Unlocked |
| Web gallery embeds | Unlocked |
| Brand profile (locked film stock) | Unlocked |

**Pricing Rationale:** $9.99/month is:
- Negligible for a business ($120/year vs. $500+/photographer session)
- Double the consumer tier (appropriate for business value)
- Competitive with Squarespace ($16/month) and basic website builders

---

## Physical Product Pricing & Margins

### Print Products

| Product | Retail Price | Estimated COGS | Gross Margin | Margin % |
|---------|-------------|---------------|-------------|----------|
| Roll prints (36 × 4×6) | $12.99 | ~$7.50 (production + shipping) | $5.49 | 42% |
| Roll prints (36 × 5×7) | $18.99 | ~$11.50 | $7.49 | 39% |
| Individual 4×6 reprint | $1.99 | ~$1.20 | $0.79 | 40% |
| Individual 5×7 reprint | $3.99 | ~$2.20 | $1.79 | 45% |
| Hardcover book (24 pages) | $29.99 | ~$17.00 | $12.99 | 43% |
| Hardcover book (48 pages) | $44.99 | ~$25.00 | $19.99 | 44% |
| Magazine (24 pages, softcover) | $12.99 | ~$7.50 | $5.49 | 42% |
| Magazine subscription | $9.99/month | ~$6.00 | $3.99 | 40% |
| Print subscription (36/month) | $11.99/month | ~$7.50 | $4.49 | 37% |

**Notes:**
- COGS includes Prodigi production + domestic US shipping
- International shipping adds $3-8 per order (passed to customer or absorbed selectively)
- Stripe processing fee (2.9% + $0.30) deducted from margin
- Free first roll COGS: ~$12-15 per roll (treated as Customer Acquisition Cost)

### Free First Roll Economics

| Metric | Value |
|--------|-------|
| Cost per free roll | ~$12-15 (production + shipping) |
| Effective CAC via free roll | $12-15 |
| Benchmark digital CAC (photo apps) | $15-30+ |
| Free-to-paid conversion target | 5-10% within 30 days |
| Free-to-paid conversion target | 15-20% within 90 days |
| Breakeven on free roll | ~3 months of Roll+ subscription |

The free first roll is Roll's most powerful acquisition tool. The physical print in the user's hands is marketing collateral that:
- Proves the quality of the film profiles
- Creates an emotional connection to the product
- Sits on a counter or fridge, reminding the user of Roll
- Gets shown to friends and family (word of mouth)

---

## Unit Economics

### Per-User Economics (Monthly)

**Free User:**
| Item | Monthly Cost |
|------|-------------|
| Supabase storage/compute (prorated) | ~$0.02 |
| R2 storage (100 photos, ~500MB) | ~$0.01 |
| PostHog analytics (prorated) | ~$0.005 |
| Infrastructure (Vercel, prorated) | ~$0.01 |
| **Total monthly cost per free user** | **~$0.05** |

**Roll+ Subscriber:**
| Item | Monthly Revenue/Cost |
|------|---------------------|
| Subscription revenue | $4.99 |
| eyeQ processing (~2 rolls/month, 72 photos × $0.03) | -$2.16 |
| R2 storage (growing, ~2GB) | -$0.03 |
| Supabase compute | -$0.05 |
| Stripe processing (2.9% + $0.30) | -$0.44 |
| Infrastructure | -$0.03 |
| **Net margin per subscriber (before overhead)** | **~$2.28/month** |
| **Margin %** | **~46%** |

**Roll+ Subscriber Who Orders Prints Monthly:**
| Item | Monthly Revenue/Cost |
|------|---------------------|
| Subscription revenue | $4.99 |
| Print order revenue (avg) | $15.00 |
| eyeQ processing | -$2.16 |
| Print COGS | -$9.00 |
| Stripe processing (on $19.99) | -$0.88 |
| Infrastructure + storage | -$0.11 |
| **Net margin per active subscriber** | **~$7.84/month** |
| **Margin %** | **~39%** |

### Lifetime Value (LTV) Estimates

| Segment | Monthly Revenue | Churn Rate | LTV | LTV:CAC |
|---------|----------------|-----------|-----|---------|
| Roll+ subscriber (no prints) | $4.99 | 5% monthly | $99.80 | 6.7x |
| Roll+ subscriber (monthly prints) | $19.99 | 3% monthly | $666.33 | 44.4x |
| Roll+ subscriber (prints + quarterly book) | $27.49 avg | 2% monthly | $1,374.50 | 91.6x |
| Roll Business subscriber | $9.99 | 4% monthly | $249.75 | 16.7x |
| Free user (orders occasional prints) | $3.00 avg | N/A | ~$36/year | N/A |

**Key Insight:** Users who order physical products have dramatically lower churn and dramatically higher LTV. The physical product creates a habit loop that pure digital features cannot match. Every strategy should prioritize getting users to their first print order.

---

## Revenue Projections Framework

### Assumptions for Modeling

| Assumption | Conservative | Base | Optimistic |
|-----------|-------------|------|-----------|
| Year 1 total users | 10,000 | 25,000 | 50,000 |
| Year 2 total users | 50,000 | 150,000 | 300,000 |
| Year 3 total users | 150,000 | 500,000 | 1,000,000 |
| Free-to-paid conversion | 5% | 8% | 12% |
| Monthly churn (Roll+) | 6% | 5% | 3% |
| Print order rate (of subscribers) | 30% | 45% | 60% |
| Avg print order value | $13 | $17 | $22 |
| Book order rate (of subscribers, quarterly) | 5% | 10% | 15% |
| Avg book order value | $30 | $38 | $45 |

### Year 1 Projection (Base Case)

| Quarter | Total Users | Paid Subs | MRR (Subs) | Print Revenue | Total Revenue |
|---------|-----------|-----------|-----------|--------------|---------------|
| Q1 | 3,000 | 150 | $749 | $1,200 | $5,946 |
| Q2 | 8,000 | 480 | $2,395 | $4,800 | $21,586 |
| Q3 | 16,000 | 1,120 | $5,589 | $11,200 | $50,366 |
| Q4 | 25,000 | 2,000 | $9,980 | $20,000 | $89,940 |
| **Year 1 Total** | | | | | **~$168K** |

### Year 2 Projection (Base Case)

| Quarter | Total Users | Paid Subs | MRR (Subs) | Print Revenue | Total Revenue |
|---------|-----------|-----------|-----------|--------------|---------------|
| Q1 | 50,000 | 4,000 | $19,960 | $40,000 | $179,880 |
| Q2 | 80,000 | 6,400 | $31,936 | $64,000 | $287,808 |
| Q3 | 120,000 | 9,600 | $47,904 | $96,000 | $431,712 |
| Q4 | 150,000 | 12,000 | $59,880 | $120,000 | $539,640 |
| **Year 2 Total** | | | | | **~$1.44M** |

### Year 3 Projection (Base Case)

| Quarter | Total Users | Paid Subs | MRR (Subs) | Print Revenue | Total Revenue |
|---------|-----------|-----------|-----------|--------------|---------------|
| Q1 | 250,000 | 20,000 | $99,800 | $200,000 | $899,400 |
| Q2 | 350,000 | 28,000 | $139,720 | $280,000 | $1,259,160 |
| Q3 | 430,000 | 34,400 | $171,656 | $344,000 | $1,546,968 |
| Q4 | 500,000 | 40,000 | $199,600 | $400,000 | $1,798,800 |
| **Year 3 Total** | | | | | **~$5.5M** |

*Note: These projections are seed assumptions for modeling. Actual growth will depend on product-market fit validation, paid acquisition spending, and viral coefficient. Book/magazine revenue adds an additional 10-20% to print revenue but is excluded here for simplicity.*

---

## Key Revenue Metrics to Track

| Metric | Definition | Target |
|--------|-----------|--------|
| MRR | Monthly Recurring Revenue (subscriptions only) | Track monthly |
| ARPU | Average Revenue Per User (all users, including free) | >$1.50/month by Year 2 |
| ARPPU | Average Revenue Per Paying User | >$12/month |
| Free-to-Paid Conversion | % of free users who become Roll+ within 90 days | >8% |
| Print Attach Rate | % of subscribers who order prints in a given month | >40% |
| Book Attach Rate | % of subscribers who order a book in a given quarter | >8% |
| Avg Order Value (AOV) | Average physical product order size | >$17 |
| Orders Per Subscriber Per Year | Average number of print/book orders per subscriber | >6 |
| Net Revenue Retention | Revenue from existing cohort vs. prior period | >100% |
| LTV:CAC Ratio | Lifetime Value / Customer Acquisition Cost | >3:1 |

---

## Pricing Sensitivity Analysis

### Subscription Price Testing

| Monthly Price | Expected Conversion | MRR per 10K Users | Notes |
|--------------|-------------------|-------------------|-------|
| $2.99 | 12% | $3,588 | High conversion, lower revenue per user |
| $4.99 | 8% | $3,992 | **Base case — optimal balance** |
| $6.99 | 5% | $3,495 | Lower conversion, subscription fatigue risk |
| $9.99 | 3% | $2,997 | Too high for consumer; viable for Business tier only |

**Recommendation:** $4.99/month maximizes total MRR by balancing conversion rate against price. Offer annual billing at $47.99/year ($3.99/month) to reduce churn and collect upfront.

### Print Price Sensitivity

| Roll Print Price | Order Rate (of subs) | Revenue per 1K Subs | COGS | Net |
|-----------------|---------------------|---------------------|------|-----|
| $9.99 | 55% | $5,495 | $4,125 | $1,370 |
| $12.99 | 45% | $5,846 | $3,375 | $2,471 |
| $15.99 | 35% | $5,597 | $2,625 | $2,972 |
| $19.99 | 25% | $4,998 | $1,875 | $3,123 |

**Recommendation:** $12.99 optimizes total margin per subscriber base. Higher prices improve per-order margin but reduce attach rate.

---

## Revenue Expansion Opportunities

### Near-Term (6-12 months)
1. **Magazine product ($9.99-$14.99)** — fills gap between prints and books; enables monthly frequency
2. **Print subscription ($11.99/month)** — recurring physical product revenue; infrastructure already exists
3. **Magazine subscription ($9.99/month)** — autopilot monthly keepsake
4. **Annual billing discount** — reduces churn, improves cash flow

### Medium-Term (12-24 months)
5. **Roll Business tier ($9.99/month)** — new segment, higher ARPU
6. **Collaborative books** — Circle members pool photos into shared books; higher AOV
7. **Gift prints/books** — "Send prints to Grandma" feature; new use case per existing user
8. **Wall art / larger formats** — 8×10, 11×14, framed prints; higher margin per order

### Long-Term (24+ months)
9. **Year bundle** — 12 monthly magazines + hardcover annual at discount
10. **Digital frame integration (Aura)** — subscription to push favorites to digital frames
11. **Enterprise/education tier** — schools, daycares sharing photos with parents
12. **White-label print API** — license the processing pipeline to other apps
