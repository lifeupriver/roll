# Roll — Product Requirements Document

> Web Prototype (Next.js) · v2.0

---

## 1. Product Vision

Roll is a web application that rescues photos from the digital graveyard. Users upload their photo libraries, Roll automatically removes junk (screenshots, duplicates, blurry shots), and presents a clean filtered feed. Users checkmark their best 36 shots to fill a "roll," choose a film stock, and Roll processes those selections with professional cloud color correction and beautiful film profiles. The result: photos that look like they were shot on film and developed by a great lab. Users can then order real photographic prints delivered to their door, and heart their absolute favorites to build a portfolio over time.

**Core promise:** Your phone captures everything. Roll turns it into something worth keeping.

**Tagline:** "Develop your roll."

---

## 2. The Four-Tier Model

This is the conceptual backbone of the entire product:

| Tier | Name | How It Gets There | Typical Size |
|---|---|---|---|
| 1 | Raw Library | Everything the user uploads. The chaos. | Hundreds to thousands |
| 2 | Filtered Feed | Server-side filtering removes junk. Content modes focus further. Manual hide catches the rest. | 50–70% of raw library |
| 3 | Developed Rolls | User checkmarks 36 per roll. Cloud processing: eyeQ correction → film LUT → grain. | 36 per roll, unlimited rolls |
| 4 | Favorites | User hearts the best from developed rolls. Portfolio-grade. | User's best-of-the-best |

**Why this model:** AI cannot reliably identify "beautiful" photos — research into AfterShoot, NIMA, and Apple Vision confirms AI assesses technical quality but not aesthetic beauty or emotional significance. Roll sidesteps this: AI does what it's good at (removing junk), humans make two distinct choices (what to develop, what to treasure), and cloud processing does what neither can do alone (professional finishing).

---

## 3. Two Gestures, Two Meanings

This interaction model is central to the product:

- **✓ Checkmark** = "Develop this." Selecting a photo for a roll. Filling the 36-exposure strip. The workhorse gesture. Happens in the filtered feed (Tier 2 → 3).
- **♥ Heart** = "Treasure this." Marking a developed photo as a favorite. Portfolio grade. The emotional gesture. Happens in the developed roll gallery (Tier 3 → 4).

Different screens, different contexts, clear mental model.

---

## 4. Target Users

### 4.1 Primary: Parents with Young Children
Households with kids ages 0–10. They shoot hundreds of photos per month. Camera roll has 20,000–50,000 images. Haven't printed anything in years. Feel guilty about it. Want a solution that requires no skill, no time, and no decisions beyond "yes, print these."

**People Only mode is built for this user.** Parents take photos of food, receipts, scenery — but the photos they want to print are almost always of their kids and family.

### 4.2 Secondary: Mom Groups and Social Circles
Groups of 5–50 who share photos in group texts or Instagram DMs. Want a private, beautiful, ad-free alternative. Circle + Favorites gives these groups a curated feed of everyone's best shots.

### 4.3 Tertiary: Small Business Owners
iPhone-first content creators, Etsy sellers, boutique owners who want consistent, intentional-looking photos without hiring a photographer.

---

## 5. MVP Feature Set (Web Prototype)

### 5.1 Photo Upload

Since the web prototype cannot access a device's camera roll directly, users upload photos via file picker or drag-and-drop.

- **Batch upload:** select multiple photos at once (up to 500 per session)
- **Drag-and-drop zone:** prominent upload area on first visit and accessible from Feed
- **Upload progress:** individual and batch progress indicators
- **Supported formats:** JPEG, HEIC, PNG, WebP. HEIC converted server-side to JPEG.
- **EXIF preservation:** capture and store date taken, GPS coordinates, camera info
- **Deduplication on upload:** prevent exact duplicate uploads via content hash

### 5.2 On-Device Filtering (Server-Side for Web)

After upload, the server applies a filtering pipeline to remove noise:

| # | Detection | Method | Action |
|---|---|---|---|
| 1 | Screenshots | Dimension ratio + metadata analysis (no EXIF camera info) | Filter |
| 2 | Very low quality | Blur detection via Laplacian variance (Sharp) | Filter if below threshold |
| 3 | Near-duplicates | Perceptual hash (pHash) + hamming distance < 5 | Collapse to best quality frame |
| 4 | Extremely dark/bright | Histogram analysis — >80% pixels in bottom or top 10% | Filter |
| 5 | Documents/text-heavy | OCR confidence or text-region percentage | Filter |

**Filtering behavior:**
- Filtered photos are hidden, never deleted. Recoverable via Account → Filtered Photos.
- Filter rate target: 30–50% of uploads (lower than iOS due to no Vision framework access).
- Processing: async job triggered after upload batch completes. Results within 30 seconds for 100 photos.

### 5.3 Content Modes

Optional filters applied on top of the filtered feed to narrow what the user sees:

| Mode | Filter Logic | Target User |
|---|---|---|
| All Photos | No additional filter. Default. | Everyone |
| People Only | Photos with detected faces (face detection via Sharp/TensorFlow.js) | Parents, families |
| Landscapes | Photos with no faces + outdoor scene indicators | Travel, nature |

- Pill-shaped selector at top of Feed: "All · People · Landscapes"
- Mode persists across sessions. Default: All.
- Additional modes (Animals, Food) post-prototype.

### 5.4 Manual Hide

- **Right-click or long-press** any photo in feed → "Hide" option
- Photo immediately disappears from feed
- Recoverable: Account → Filtered Photos (distinguished from auto-filtered)
- Manual hides logged for filter threshold tuning analytics

### 5.5 Checkmark-Based Roll Building

Users build rolls by checkmarking photos in the filtered feed. Each roll holds exactly **36 photos** — one standard 35mm film roll.

**Interaction:**
- Single tap/click on checkmark icon to select for current roll. Tap again to deselect.
- **Roll progress indicator** always visible: film-strip metaphor showing "23 / 36" with visual fill. This is the app's signature UI element.
- Checkmarks persist across sessions.

**Multiple rolls:**
- At photo #36, the current roll **auto-closes** with a celebration moment.
- Closed roll appears in "Ready to Develop" queue.
- No limit on pending rolls.
- Users can manually close a roll at any count ≥10 via "Develop now."
- Each roll can have a different film stock.

**Roll management:**
- Auto-generated names from dominant date range (e.g., "February 12–18"). Editable.
- Drag-to-reorder photos within a roll before developing.
- Swipe/remove a photo from a pending roll — it returns to the filtered feed.

### 5.6 Film Profiles

After a roll is complete, the user selects a film stock:

| Name | Type | Character | Default |
|---|---|---|---|
| **Warmth** | Color | Warm skin tones, lifted shadows, gentle grain | ✓ Yes |
| **Golden** | Color | Punchy, nostalgic, amber-warm highlights | |
| **Vivid** | Color | High saturation, fine grain, bold and graphic | |
| **Classic** | B&W | High contrast, pronounced grain, timeless | |
| **Gentle** | B&W | Soft contrast, beautiful mid-tones, forgiving | |
| **Modern** | B&W | Fine grain, clean shadows, contemporary | |

- Horizontal scroll with live preview applied to a sample photo from the roll
- One film stock per roll. Different rolls can use different stocks.
- **Free tier:** Warmth only. **Roll+:** All 6 profiles.
- Names are trademark-safe. Never use Kodak/Fuji stock names in UI.

### 5.7 Cloud Processing Pipeline

For each photo in a completed roll:

1. **Upload** original from R2 to eyeQ Web API
2. **eyeQ correction:** scene detection, white balance, skin tone accuracy, exposure normalization, sharpening
3. **Film profile application:** LUT via Sharp → grain composite → subtle vignette
4. **Store** processed JPEG alongside original in R2
5. **Notify** user: "Your roll is developed"

Estimated time: 1–3 sec/photo (eyeQ) + <1 sec/photo (LUT/grain). Full 36-photo roll: under 2 minutes.

### 5.8 Favorites (Portfolio Tier)

After a roll is developed, the user reviews processed photos and hearts the special ones:

- Hearts appear on developed photos only (roll gallery and Library)
- Single tap to heart/unheart
- Hearted photos collected in **Favorites** section in Library tab
- Expected rate: ~15–20% of developed photos (5–7 per roll)

**What Favorites unlock:**
- **Album printing:** 24+ favorites → print as a curated album set
- **Circle sharing:** share Favorites to a Circle (portfolio-grade, not every photo)
- **Year in Review** (post-prototype): annual highlights seeded from Favorites

### 5.9 Physical Print Ordering

**The Free First Roll:**
After developing their first roll, users are offered up to 36 free 4×6 prints with free shipping — no credit card required.

*"Your roll is developed. We'll print all 36 and send them to you — free."*

User enters a shipping address. That's it. No subscription prompt until prints arrive.

**Print products:**
| Product | Description |
|---|---|
| Roll Prints | 36 (or fewer) 4×6 prints from a single developed roll |
| Album Prints | 24–36 prints from Favorites collection. Premium packaging. |
| Individual Prints | Reprint any developed photo. 4×6 or 5×7. |

**Fulfillment:** Prodigi API. Fujifilm Frontier lab printers. 3–5 business day turnaround.

**For the prototype:** full UI flow always present. Actual Prodigi API calls toggled by environment variable (`ENABLE_PRINT_FULFILLMENT=true`).

### 5.10 Circle (Private Sharing)

Circle is Roll's private sharing layer. Not a social network — a shared album that updates as members develop rolls and heart favorites.

- **Create:** Roll+ subscribers only. Name it, optional cover photo.
- **Invite:** share link with 7-day expiry.
- **Feed:** chronological, newest first. No algorithm. No ads.
- **Sharing:** default suggests Favorites from a roll, not the full roll.
- **Reactions:** heart, smile, wow. Private, visible only to poster.
- **Members can order prints** from shared photos.
- **No comments** in prototype. Reactions only.

---

## 6. Onboarding Flow

| Screen | Purpose | Content |
|---|---|---|
| 1 | Splash + Auth | Film grain animation. ROLL logotype. "Develop your roll." Email/magic link sign in. |
| 2 | Upload | "Upload your photos and we'll clean up the noise." Drag-and-drop zone + file picker. |
| 3 | Processing | Animated film roll loader. "Cleaning up your library…" (5–30 sec depending on batch size) |
| 4 | Your Filtered Feed | "We removed [N] screenshots, duplicates, and blurry shots. Here's what's worth keeping." Content mode pills visible. CTA: "Start picking your favorites." **First value moment.** |
| 5 | Two-Gesture Tutorial | Brief overlay: "✓ Checkmark photos to fill your roll. ♥ Heart your favorites after developing." Dismissable. |

**Key:** No prints or shipping during onboarding. First value = the filtered feed. Print offer comes after first roll is developed.

---

## 7. Subscription Model (Simulated in Prototype)

| Feature | Free | Roll+ |
|---|---|---|
| Upload + filtering | Unlimited | Unlimited |
| Content modes | All | All |
| Manual hide | Unlimited | Unlimited |
| Checkmarking + rolls | Unlimited | Unlimited |
| Film profiles | Warmth only | All 6 |
| Cloud processing | First roll free | Unlimited |
| Cloud backup | 100 photos | Unlimited |
| Favorites | View only | Full access |
| Album printing | ✗ | From Favorites |
| Circle | Join + view only | Create, manage, share |
| Print sizes | 4×6 only | 4×6 and 5×7 |

**Prototype implementation:** toggle between free/plus in Account settings. No real payment processing. This simulates the tier gate for UX testing.

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| Filter precision | >90% (prototype target, lower than iOS) |
| Time to first checkmark | <2 min from filtered feed |
| First roll completion | >60% of users who checkmark 1+ photo reach 36 |
| Favorites rate | >15% of developed photos hearted |
| Roll develop completion | >80% of filled rolls are actually developed |
| Circle invite acceptance | >50% of invite links result in sign-up |
| "Would you pay for this?" | >30% of prototype testers say yes |

---

## 9. Out of Scope for Prototype

- Video processing or any video feature
- Real payment processing (Stripe, RevenueCat)
- Native iOS app
- Social posting to Instagram/TikTok/Meta
- Digital frame integration (Aura)
- Manual photo editing (sliders, crop, adjustments)
- Comments in Circle
- Bound photo books
- Calendars, magnets, or non-print products
- People tagging or face recognition search
- AI-suggested checkmarks
- Multiple film stocks per roll
