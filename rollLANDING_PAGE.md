# Roll — Landing Page

> The single public-facing page at roll.photos. Everything else is behind auth. This page converts visitors into users — it must feel like picking up a finished roll of prints for the first time.

---

## 1. Purpose & Emotional Target

The landing page does one thing: converts a visitor into a user who enters their email.

**Target conversion rate:** 15%+ of visitors enter their email.

**Emotional arc:** The page walks the visitor through a feeling, not a feature list. The sequence is:

1. **Recognition** — "That's exactly my problem" (the buried-photos pain point)
2. **Curiosity** — "How does this work?" (the three-step process)
3. **Desire** — "I want my photos to look like that" (film profile showcase)
4. **Trust** — "Free first roll? No catch?" (the free prints offer)
5. **Action** — email entry

Every section exists to serve one of these five beats. If a section doesn't clearly serve one, cut it.

---

## 2. Design Direction

The landing page shares the app's design system (see rollDESIGN_SYSTEM.md) but makes bolder use of its display typography and spacing. The page should feel like a photography monograph — generous whitespace, editorial type, photos doing the emotional work.

### Surface & Color

- Background: `var(--color-surface)` — the warm cream of unexposed photo paper
- Text: `var(--color-ink)` — developer-tray black, warm not clinical
- Secondary text: `var(--color-ink-secondary)` — for body paragraphs and captions
- Accent: `var(--color-action)` — the safelight terracotta, used sparingly: CTA buttons and one or two highlight moments only
- Film grain texture overlay at 4% opacity on the page background (see rollDESIGN_SYSTEM.md Section 7, "Film Grain Texture"). The grain makes the cream surface feel like actual paper, not a flat CSS color.

### Typography

- Headlines: `var(--font-display)` (Cormorant Garamond) — the Garamond of photography monograph publishers. Wide tracking on the logotype (`0.15em`), wider on section headlines (`0.04em`) than body to create a distinct register. Weight 500 for headings, 300 italic for taglines — lighter weights let the refined strokes breathe at large sizes.
- Body: `var(--font-body)` (Plus Jakarta Sans) — geometric humanist with warm rounded terminals. Weight 300 (light) for body text, 500 uppercase with wide tracking for UI labels. Distinctive "a" and "g" avoid the anonymity of generic sans-serifs.
- Monospaced accents: `var(--font-mono)` (Space Mono) — geometric monospace with retro-tech personality. For the "36" frame count, any technical detail. The quirky letterforms feel like the data imprint stamped on a film negative's border.

### Layout

- Single column, max `800px` content width, centered
- Mobile-first — this page will be shared in mom groups and text threads, so mobile is the primary experience
- Generous vertical spacing between sections: `var(--space-hero)` (64px) minimum between major sections
- No sidebar, no sticky nav, no floating elements. The page is a vertical scroll, like flipping through a lookbook.

### What This Is NOT

- Not a SaaS landing page with blue accents, white backgrounds, and a hero illustration
- Not a feature comparison matrix with checkmarks in columns
- Not a tech startup page with gradient meshes and glassmorphism
- The photography IS the design. Real processed photos do the visual work. UI mockups are secondary.

---

## 3. Page Structure (Top to Bottom)

### 3.1 Hero Section — "Recognition"

The hero occupies at least `80vh` on mobile. It's mostly air — the logotype, one line of copy, and the email input. The restraint IS the design.

```
[ROLL logotype]
  Font: var(--font-display), 700, var(--text-logotype) (3rem)
  Tracking: 0.15em — wide, engraved, like stamped metal on a camera body
  Color: var(--color-ink)
  Centered

"Your phone captures everything.
 Roll turns it into something worth keeping."
  Font: var(--font-display), 300 italic, var(--text-display) (1.875rem on desktop)
  Use fluid type: clamp(1.25rem, 3vw + 0.5rem, 1.875rem)
  Color: var(--color-ink)
  Line-height: 1.3
  Max-width: 28ch — forces the line break to land naturally
  Light italic Cormorant Garamond at display size — airy, unhurried, the voice of quiet confidence

[Email input + "Get Started" button]
  Input: var(--color-surface-sunken) background, var(--color-border) border
  Button: var(--color-action) background, var(--color-ink-inverse) text
  Both use var(--radius-sharp) (4px) — deliberate, not soft
  Button font: var(--font-body), 600 (semi-bold for primary action), var(--text-label)

"Free to try. No credit card."
  Font: var(--font-body), 300, var(--text-caption)
  Color: var(--color-ink-tertiary)
```

**Visual below the tagline:** A single, carefully chosen photograph — processed through the Warmth film profile. Not a grid, not a before/after, not a UI mockup. One beautiful photo that makes the visitor feel something. The photo does the selling.

**Spacing:** The hero breathes. `var(--space-hero)` (64px) below the logotype, `var(--space-section)` (24px) between tagline and email input. On mobile, the hero is almost entirely type and whitespace.

### 3.2 The Problem — "Recognition"

```
"20,000 photos on your phone.
 Zero on your wall."
  Font: var(--font-display), 500, var(--text-title) (1.5rem)
  Color: var(--color-ink)

You take hundreds of photos every month. Screenshots, duplicates,
blurry shots — they pile up alongside the photos that actually matter.
The good ones get buried. Nothing gets printed.
  Font: var(--font-body), 300, var(--text-body)
  Color: var(--color-ink-secondary)
  Max-width: 55ch — comfortable reading measure
  Line-height: 1.6
```

**Design:** Text only. No images. Let the words land. The restraint here creates contrast with the visual richness of the next section. Left-aligned body text, centered heading.

### 3.3 How It Works — "Curiosity"

Three numbered steps. Each step has a number, a short heading, a one-paragraph explanation, and an illustrative photo (not a UI screenshot — a photo that represents the concept).

```
1. Upload your photos
   "Drop in your camera roll. Roll removes the screenshots,
    duplicates, and blurry shots automatically."
   [Photo: a dense, slightly chaotic grid of thumbnails becoming
    a cleaner, curated grid — the contact sheet metaphor]

2. Pick your favorites
   "Checkmark your best 36 photos to fill a roll.
    Choose a film stock. We develop them."
   [Photo: a contact sheet with grease-pencil circles around
    the keepers — the physical act of selection]

3. Get real prints
   "Your first roll of prints is free. Delivered to your door
    in 3–5 days. Photos that look like they were shot on film."
   [Photo: a kraft envelope opened, 4×6 prints fanned out on a
    table — the moment of receiving]
```

**Step number styling:**
```
Number: var(--font-mono), 700, var(--text-display)
  Color: var(--color-action) — safelight amber, the eye-catcher
  This is one of the few places the accent appears outside buttons
```

**Layout:**
- Desktop: three-column row, each step is a card
- Mobile: stacked vertically with `var(--space-region)` (32px) between steps
- Step cards: `var(--color-surface-raised)` background, `var(--radius-card)` (8px), `var(--shadow-raised)`, padding `var(--space-component)` (16px)

### 3.4 Film Profiles Showcase — "Desire"

This section creates want. The same photo processed through all six film profiles, displayed in a horizontal scroll. The visitor sees what their photos could look like.

```
"Six film stocks. Each one beautiful."
  Font: var(--font-display), 500, var(--text-title)

[Horizontal scroll of 6 film profile cards]
[Single photo — warm, human, emotional — shown in all 6 profiles]
```

**Film profile card:**
```
Width: 200px (desktop), 160px (mobile)
Border-radius: var(--radius-card)
Photo: processed sample, aspect-ratio 4:3, rounded top corners only
Label: profile name, var(--font-display), var(--text-label), centered
Badge: 6px circle of the profile's signature color:
  Warmth:  var(--color-stock-warmth)   — warm peach emulsion
  Golden:  var(--color-stock-golden)   — Kodak amber
  Vivid:   var(--color-stock-vivid)    — Fuji green
  Classic: var(--color-stock-classic)  — silver gelatin B&W
  Gentle:  var(--color-stock-gentle)   — soft platinum
  Modern:  var(--color-stock-modern)   — high contrast darkroom
```

**Important:** The comparison photo should be a warm, human photo — a parent with a child, friends laughing, a candid moment. Not a landscape, not food, not a flat-lay. The target audience is people who care about photos of people they love.

**Scroll behavior:** Horizontal scroll with inertia (CSS `overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch`). Each card snaps. Edge-to-edge on mobile (cards bleed past the `800px` content container).

### 3.5 The Free First Roll — "Trust"

This section overcomes the last objection. It has its own visual weight — a background shift that sets it apart.

```
Background: var(--color-surface-raised) — a kraft-paper warmth,
  like the envelope your prints arrive in. Distinct from the
  page background but within the same color family.

"Your first roll is free."
  Font: var(--font-display), 700, var(--text-title)

Upload your photos. Pick your 36 favorites.
We develop them and print them — on us.
No credit card. No catch. Real 4×6 prints
delivered to your door.
  Font: var(--font-body), 300, var(--text-lead) (18px — slightly larger
  than standard body, giving this section extra authority)
  Color: var(--color-ink)
  Max-width: 40ch — short lines, punchy rhythm

[CTA: "Get your free prints" → smooth-scrolls to hero email input]
  Same button styling as hero: var(--color-action), var(--color-ink-inverse)
```

**"36" in monospace:** Wherever the number 36 appears on this page, render it in `var(--font-mono)` — the mechanical precision of a film counter. It's a small detail but it reinforces the analog physicality.

### 3.6 Circle (Private Sharing) — Brief Mention

```
"Share with the people who matter."
  Font: var(--font-display), 500, var(--text-heading)

Circle is your private photo feed. No ads. No algorithm.
Just the best photos from the people you love.
  Font: var(--font-body), 300, var(--text-body)
  Color: var(--color-ink-secondary)
```

**Design:** Brief. One paragraph plus a simple visual (3–4 photos in a vertical feed with small name/avatar tags). Don't over-explain — Circle is a discovery feature, not a selling point at signup. This section exists to plant a seed, not close a sale.

### 3.7 Pricing — Simple

```
"Free to start. $4.99/month for everything."
  Font: var(--font-display), 500, var(--text-title)
```

**Two tiers, clean text:**

```
Free:
  Upload and filter unlimited photos
  Develop your first roll with Warmth
  First 36 prints free

Roll+:
  All 6 film stocks
  Unlimited cloud processing
  Create and manage Circles
  Album printing from Favorites
  Cloud backup for all your photos

[CTA: "Start free" → smooth-scrolls to hero email input]
```

**Layout:**
- Desktop: two-column, side-by-side
- Mobile: stacked vertically
- Free tier: `var(--color-surface)` background, `var(--color-border)` outline
- Roll+ tier: `var(--color-surface-raised)` background, `var(--color-border-strong)` outline, `var(--shadow-raised)`
- No checkmark grid. No feature comparison matrix. Just short text lists in `var(--font-body)`, `var(--text-label)`.
- Tier headings in `var(--font-display)`, `var(--text-lead)`

### 3.8 Footer CTA — Final Email Capture

```
"Develop your roll."
  Font: var(--font-display), 500, var(--text-display)
  The tagline callback — the page began with "Your phone captures everything,"
  and ends with the invitation to act.

[Email input + "Get Started" button]
  Same styling as hero — consistency breeds trust

"No ads. No algorithm. No selling your data.
 Just your photos, made beautiful."
  Font: var(--font-body), 300, var(--text-caption)
  Color: var(--color-ink-tertiary)
```

### 3.9 Footer

```
Roll · Made with love for the photos that matter.
  Font: var(--font-body), 300, var(--text-caption)
  Color: var(--color-ink-tertiary)

Privacy · Terms · Contact
  Font: var(--font-body), 300, var(--text-caption)
  Color: var(--color-ink-secondary)
  Underline on hover — ghost link style (see rollDESIGN_SYSTEM.md 5.1)

© 2026 Roll
```

**Design:** Minimal. Same surface as the page. No background color change. The page ends quietly.

---

## 4. Responsive Behavior

| Element | Mobile (<768px) | Desktop (≥768px) |
|---|---|---|
| Logotype | `--text-display` (1.875rem) | `--text-logotype` (3rem) |
| Hero tagline | `clamp(1.25rem, ...)` | `--text-display` (1.875rem) |
| Section headings | `--text-heading` (1.25rem) | `--text-title` (1.5rem) |
| Body text | `--text-body` (1rem) | `--text-body` (1rem) |
| How It Works | Stacked vertically | 3-column row |
| Film profiles | Horizontal scroll, 160px cards | Horizontal scroll, 200px cards |
| Pricing | Stacked | Two-column side-by-side |
| Section spacing | `var(--space-page)` (48px) | `var(--space-hero)` (64px) |
| Page padding | `var(--space-component)` (16px) | `var(--space-section)` (24px) |
| Content max-width | 100% - 32px | 800px centered |

---

## 5. Technical Implementation

### Render Strategy

- **Static (SSG):** `export const dynamic = 'force-static'` — this page never changes between requests
- **No JavaScript required for content.** Interactive elements: email input validation + smooth scroll to email input from CTA buttons. That's it.
- **No client components** except the email form (needs `useState` for input + submission)

### Performance Budget

| Metric | Target | Why |
|---|---|---|
| LCP | < 1.5s | Hero photo is the LCP element — must be fast |
| FCP | < 1.0s | Cream background + logotype text renders instantly |
| Total page weight | < 500KB | Including all photos (WebP, optimized) |
| CLS | < 0.05 | Fixed dimensions on all images, no layout shift |

### Image Strategy

- Hero photo and film profile samples: optimized WebP, `<Image>` with `priority` (hero) and `loading="lazy"` (below fold)
- LQIP (Low-Quality Image Placeholders): 20px-wide blurred previews inline as base64 for each photo
- Film grain texture: 200×200px tileable WebP, loaded as CSS background-image (cached indefinitely)

### SEO & Meta Tags

```html
<title>Roll — Develop your roll.</title>
<meta name="description" content="Upload your photos. Pick your favorites. Get real prints delivered to your door. Roll removes the junk, applies beautiful film profiles, and turns your camera roll into something worth keeping." />
<meta property="og:title" content="Roll — Develop your roll." />
<meta property="og:description" content="Your phone captures everything. Roll turns it into something worth keeping." />
<meta property="og:image" content="https://roll.photos/og-image.jpg" />
<meta property="og:url" content="https://roll.photos" />
<meta name="twitter:card" content="summary_large_image" />
```

The OG image should be a processed photo (Warmth profile) at 1200×630px — not a logo, not a UI screenshot. A beautiful photo that makes someone want to click.

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Roll",
  "url": "https://roll.photos",
  "description": "Upload your photos, pick your favorites, get real prints. Roll removes junk and applies beautiful film profiles.",
  "applicationCategory": "PhotographyApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free first roll of prints"
  }
}
```

---

## 6. Conversion Tracking (Post-Prototype)

Not implemented in prototype, but planned:

- **Email signup event:** When a user submits the email form (hero or footer CTA)
- **Scroll depth:** Track passage through each of the five emotional beats
- **CTA source:** Which button drove the signup — hero, free-roll section, or footer
- **Referral tracking:** UTM parameters for mom group links, social shares, text threads
- **Film profile engagement:** Which profile card was visible when the user scrolled past (informs which profiles resonate in marketing)

---

## 7. Anti-Patterns

These are specific to Roll's landing page. If you find yourself doing any of these, stop.

1. **No stock photography of generic families.** Use real photos processed through actual Roll film profiles. If you don't have them yet, use high-quality placeholder photos processed through the LUT pipeline. Never use unprocessed stock photos.

2. **No feature comparison matrix with checkmarks.** Keep pricing as short text lists. The checkmark grid is the most generic SaaS pattern — Roll is not a SaaS dashboard.

3. **No testimonials in prototype.** Real testimonials come after real users. Fake testimonials are worse than none.

4. **No video autoplay.** Static images and text. The page should feel calm, not busy. The emotional tone is the quiet satisfaction of opening an envelope of prints, not the dopamine rush of a TikTok.

5. **No chat widget or popup.** Clean, focused experience. No interstitials, no cookie banners beyond the legally required minimum (auto-decline optional cookies).

6. **No "Sign up for our newsletter."** The only email capture is for account creation. There is no newsletter. The product IS the engagement loop.

7. **No blue accent color anywhere.** The accent is `var(--color-action)` — safelight terracotta. If you see blue, it's a default that leaked through. Fix it.

8. **No white (#FFFFFF) backgrounds.** The surface is `var(--color-surface)` — warm cream. Pure white is clinical and breaks the analog warmth. The only place white appears is in the high-contrast accessibility override.

9. **No border-radius greater than `var(--radius-card)` (8px) on rectangular elements.** The aesthetic is sharp and deliberate, not soft and friendly. Pills (`--radius-pill`) are only for small badges and avatars. Photo cards, buttons, and containers use `--radius-sharp` (4px) or `--radius-card` (8px).

---

## 8. Cross-References

This document connects to:

- **rollDESIGN_SYSTEM.md** — All color tokens, typography, spacing, radii, shadows, film grain texture, and component patterns referenced in this spec are defined there. Sections 2 (tokens), 3 (typography), 4 (surfaces), 5.1 (buttons), and 7 (animations/grain) are directly relevant.
- **rollFRONTEND.md** — The email form component and CTA button patterns follow the frontend spec's component definitions. The landing page route is defined in Section 1 (Routing).
- **rollDESIGN_SYSTEM.md Section 11** — Run the four design system tests (swap, token, signature, squint) against the landing page before shipping. The landing page is the first thing a visitor sees — if it fails the swap test (still looks like Roll with Inter + blue + white), the design system isn't applied deeply enough.
