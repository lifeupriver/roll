# Roll — Design System

> Visual language rooted in the physical world of film photography: darkrooms, contact sheets, developer trays, and the warm amber light of a safe lamp.

---

## 1. Domain Exploration

Before any visual decision, we spent time in Roll's world. This grounds every token, every surface, every interaction in something real — not a SaaS template with warm colors painted on.

### The Physical World of Film

**Darkroom:** Amber safelight glow on wet prints. Chemical trays in sequence — developer, stop bath, fixer. The smell of acetic acid. Total focus. The only light is warm and directional.

**Contact sheet:** 36 frames on a single page, organized in strips of 6. Grease pencil marks circling the keepers. Dense visual information with deliberate selection marks.

**Film canister:** Small, cylindrical, labeled with hand-written notes. The anticipation before the first frame is exposed. The counter ticking up: 12… 24… 36.

**Photo lab envelope:** Matte kraft paper, printed address, the weight of developed prints inside. Opening it and fanning through your photos for the first time.

**Emulsion:** The actual surface of film — a thin coating of light-sensitive silver halide crystals suspended in gelatin on a cellulose base. It has texture, grain, warmth.

### Color World

These colors exist naturally in Roll's domain — they weren't chosen from a palette tool:

| Source | Color | Why It Belongs |
|---|---|---|
| Unexposed photo paper | Warm cream `#FAF7F2` | The surface before the image appears |
| Amber safelight | Terracotta-amber `#C45D3E` | The only light in a darkroom — warm, directional, alive |
| Developer fluid | Deep walnut `#1A1612` | The dark tray where images emerge |
| Kraft lab envelope | Sandy tan `#EBE3D7` | The vessel that carries finished prints |
| Grease pencil mark | Warm charcoal `#2C2520` | The mark that says "this one" on a contact sheet |
| Fixer residue | Cool silver `#8C8074` | Metallic, muted — the chemistry of permanence |

### Signature Element

**The film strip progress bar.** This element could only exist in Roll. It's not a progress bar with a film theme — it IS a film strip. Sprocket holes along the edges. A frame counter in monospaced type. The amber fill of exposed frames. When it hits 36, it behaves like a completed roll: the counter locks, the bar glows. No other app has this. If you see it, you know it's Roll.

### Defaults We Reject

| Default | Why It's Wrong | What We Do Instead |
|---|---|---|
| Blue accent color | Every SaaS uses blue. Roll lives in amber darkroom light. | Terracotta accent — the color of the safelight |
| White backgrounds | Clinical. Roll is about warmth and physical prints. | Cream — the color of unexposed photo paper |
| Generic progress bar | A horizontal fill means nothing emotionally. | Film strip with sprocket holes, frame counter, exposure metaphor |
| Card-based grid | Pinterest/Instagram clone energy. | Contact sheet grid — tight 4px gaps, photos nearly touching, like film strips laid on a light table |
| System font stack / Inter / Playfair Display | Invisible — or worse, signals "AI generated this." Inter is the most overused sans-serif in modern web design. Playfair Display is the default AI serif. | Cormorant Garamond display (the actual typeface of photography monograph publishers) + Plus Jakarta Sans body (geometric warmth, distinctive letterforms) |

---

## 2. Design Tokens — Tailwind v4

Roll uses Tailwind CSS v4's native `@theme` configuration. No `tailwind.config.ts`. Every token name is drawn from the film photography domain.

### 2.1 Color Tokens

```css
/* src/app/globals.css */

@theme {
  /* === PRIMITIVE TOKENS === */
  /* Named for their source in the physical world of film */

  /* Papers — the surfaces prints live on */
  --color-paper: oklch(0.97 0.01 80);          /* #FAF7F2 — unexposed photo paper */
  --color-paper-warm: oklch(0.94 0.02 75);     /* #F3EDE4 — handled print paper, slightly aged */
  --color-paper-kraft: oklch(0.91 0.03 70);    /* #EBE3D7 — kraft lab envelope */

  /* Darkroom — the spaces where images emerge */
  --color-darkroom: oklch(0.15 0.02 55);       /* #1A1612 — developer tray, near-black warmth */
  --color-darkroom-wall: oklch(0.22 0.02 50);  /* #2C2520 — darkroom wall, grease pencil */
  --color-darkroom-bench: oklch(0.30 0.02 45); /* #3D342C — work surface */

  /* Chemistry — the process colors */
  --color-safelight: oklch(0.62 0.15 45);      /* #C45D3E — amber safelight, the only warm light */
  --color-safelight-dim: oklch(0.52 0.13 42);  /* #A84D32 — dimmer safelight, hover state */
  --color-safelight-glow: oklch(0.90 0.06 50); /* #F2DDD5 — safelight reflected on paper */
  --color-fixer: oklch(0.58 0.02 60);          /* #8C8074 — silver fixer residue */
  --color-developer: oklch(0.44 0.02 55);      /* #5C5147 — developer fluid, readable mid-tone */

  /* Film stock — profile accent colors */
  --color-stock-warmth: oklch(0.75 0.10 60);   /* #E8A87C — warm peach emulsion */
  --color-stock-golden: oklch(0.73 0.12 85);   /* #D4A843 — Kodak amber, golden hour */
  --color-stock-vivid: oklch(0.60 0.12 135);   /* #6B8F4E — Fuji green, saturated life */
  --color-stock-classic: oklch(0.35 0.00 0);   /* #4A4A4A — silver gelatin, true B&W */
  --color-stock-gentle: oklch(0.58 0.02 60);   /* #8C8074 — soft platinum print */
  --color-stock-modern: oklch(0.22 0.02 50);   /* #2C2520 — high contrast darkroom print */

  /* Semantic */
  --color-heart: oklch(0.55 0.20 25);          /* #D64545 — not generic red, the warmth of a treasured print */
  --color-heart-hover: oklch(0.48 0.18 25);    /* #BF3636 */
  --color-developed: oklch(0.55 0.10 145);     /* #5B8C5A — the green "safe" indicator on a developing timer */
  --color-processing: oklch(0.73 0.12 85);     /* #D4A843 — amber, like a timer counting down */
  --color-error: oklch(0.62 0.15 45);          /* same as safelight — urgency shares the accent */

  /* Film strip — the sprocket-hole UI element */
  --color-filmstrip: oklch(0.15 0.02 55);      /* same as darkroom — the strip IS darkroom material */
  --color-sprocket: oklch(0.22 0.02 50);       /* punched holes, slightly lighter */
  --color-framecounter: oklch(0.73 0.12 85);   /* amber counter, like DX coding on film */

  /* === SEMANTIC TOKENS === */
  /* These map primitives to usage. Swap these for dark mode. */

  --color-surface: var(--color-paper);
  --color-surface-raised: var(--color-paper-warm);
  --color-surface-sunken: var(--color-paper-kraft);
  --color-surface-overlay: var(--color-darkroom);

  --color-ink: var(--color-darkroom);
  --color-ink-secondary: var(--color-developer);
  --color-ink-tertiary: var(--color-fixer);
  --color-ink-inverse: var(--color-paper);

  --color-action: var(--color-safelight);
  --color-action-hover: var(--color-safelight-dim);
  --color-action-subtle: var(--color-safelight-glow);

  --color-border: oklch(0.91 0.02 70 / 0.6);  /* transparent kraft — borders that disappear when you're not looking */
  --color-border-strong: oklch(0.80 0.02 65 / 0.8);
  --color-border-focus: var(--color-safelight);

  /* === TYPOGRAPHY === */
  --font-display: 'Cormorant Garamond', 'Garamond', 'Georgia', serif;
  --font-body: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Space Mono', 'SF Mono', monospace;

  /* Type scale — not a generic ramp. Each size has a specific role. */
  --text-caption: 0.75rem;     /* 12px — EXIF data, timestamps, film metadata */
  --text-label: 0.875rem;      /* 14px — UI labels, pill text, button text */
  --text-body: 1rem;           /* 16px — readable body text, descriptions */
  --text-lead: 1.125rem;       /* 18px — card titles, emphasized body */
  --text-heading: 1.25rem;     /* 20px — section headings */
  --text-title: 1.5rem;        /* 24px — page titles */
  --text-display: 1.875rem;    /* 30px — hero moments, roll names in detail view */
  --text-logotype: 3rem;       /* 48px — "ROLL" logotype only */

  /* === SPACING === */
  /* 4px base unit. Named by usage context, not just size. */
  --space-micro: 0.25rem;      /* 4px — contact sheet gap, icon-to-text */
  --space-tight: 0.5rem;       /* 8px — within compact elements, pill padding */
  --space-element: 0.75rem;    /* 12px — between related items in a group */
  --space-component: 1rem;     /* 16px — standard component padding, form gaps */
  --space-section: 1.5rem;     /* 24px — between sections within a page */
  --space-region: 2rem;        /* 32px — between major page regions */
  --space-page: 3rem;          /* 48px — page-level vertical breathing room */
  --space-hero: 4rem;          /* 64px — above-the-fold hero spacing */

  /* === RADII === */
  --radius-sharp: 4px;         /* Buttons, badges — deliberate, not soft */
  --radius-card: 8px;          /* Cards, panels — just enough to feel handled */
  --radius-modal: 12px;        /* Modals, sheets — larger containers */
  --radius-pill: 9999px;       /* Pills, avatars — fully round */

  /* === SHADOWS === */
  /* Depth strategy: surface color shifts + subtle shadows. Not borders-only, not dramatic drops. */
  --shadow-raised: 0 1px 3px oklch(0.15 0.02 55 / 0.06), 0 1px 2px oklch(0.15 0.02 55 / 0.04);
  --shadow-floating: 0 4px 12px oklch(0.15 0.02 55 / 0.08), 0 2px 4px oklch(0.15 0.02 55 / 0.04);
  --shadow-overlay: 0 12px 32px oklch(0.15 0.02 55 / 0.12), 0 4px 8px oklch(0.15 0.02 55 / 0.06);
}
```

### 2.2 Dark Mode Tokens

```css
@custom-variant dark (&:where(.dark, .dark *));

/* Dark mode: the darkroom itself */
@layer base {
  .dark {
    --color-surface: var(--color-darkroom);
    --color-surface-raised: var(--color-darkroom-wall);
    --color-surface-sunken: oklch(0.12 0.02 55);
    --color-surface-overlay: oklch(0.10 0.02 55);

    --color-ink: var(--color-paper);
    --color-ink-secondary: oklch(0.78 0.02 70);
    --color-ink-tertiary: var(--color-fixer);
    --color-ink-inverse: var(--color-darkroom);

    /* Safelight accent stays — it IS the darkroom */
    --color-action: var(--color-safelight);
    --color-action-hover: oklch(0.68 0.16 48);
    --color-action-subtle: oklch(0.25 0.06 45);

    --color-border: oklch(0.30 0.02 50 / 0.5);
    --color-border-strong: oklch(0.40 0.02 50 / 0.6);

    /* Shadows shift to borders in dark — shadows are invisible on dark surfaces */
    --shadow-raised: 0 0 0 1px oklch(0.30 0.02 50 / 0.3);
    --shadow-floating: 0 0 0 1px oklch(0.30 0.02 50 / 0.4), 0 4px 12px oklch(0 0 0 / 0.3);
    --shadow-overlay: 0 0 0 1px oklch(0.30 0.02 50 / 0.5), 0 12px 32px oklch(0 0 0 / 0.5);
  }
}
```

---

## 3. Typography

### Why These Fonts

**Cormorant Garamond (display headings):** A Garamond — the typeface family that Steidl, Aperture, and MACK use to set photography monographs. Lighter stroke weight than Playfair Display, with refined contrast that comes alive at large sizes. The light and regular weights at display scale create the elegance of an actual book title page — airy, confident, unhurried. Used for "ROLL" logotype, page headings, roll names, and film stock names in italic. It says "this was typeset, not templated."

**Plus Jakarta Sans (body and UI):** Geometric humanist with warm rounded terminals. The double-story "a" and "g" have genuine character — distinctive enough to avoid the anonymity of Inter or system sans-serifs, warm enough to sit naturally beside a Garamond display face. Excellent x-height for dense photo metadata at small sizes. Used for everything functional: labels, body text, buttons, navigation. Weight 300 (light) for body text creates dramatic contrast with the 700 display headings.

**Space Mono (data):** Geometric monospace with retro-technical personality — the letterforms have visible quirkiness, like the data imprint stamped by a camera onto the border of a film negative. The "1" carries a flag, the "0" has a centered dot. More characterful than developer-oriented monospace fonts. Used for the frame counter ("23 / 36"), EXIF data, timestamps, and any technical readout.

### Type Scale Usage

| Element | Font | Weight | Size Token | Tracking | Style | WHY |
|---|---|---|---|---|---|---|
| "ROLL" logotype | Display | 700 | `--text-logotype` | 0.15em | normal | Wide tracking = engraved, permanent. Like stamped metal on a camera body. |
| Page headings | Display | 500 | `--text-title` | 0.04em | normal | Medium weight — Cormorant's refined strokes carry authority without heavy weight. Wider tracking than body creates a distinct register. |
| Roll names | Display | 500 | `--text-display` | 0.02em | normal | The roll is a personal artifact — its name deserves display treatment. |
| Section headings | Display | 500 | `--text-heading` | 0.03em | normal | Maintains serif thread through hierarchy. Lighter weight lets the letterforms breathe. |
| Film stock names | Display | 400 | `--text-lead` | 0.02em | italic | Italic for emotional/aesthetic labels. "Warmth", "Golden", "Vivid" — names that describe feeling, set in the voice of feeling. |
| Taglines / quotes | Display | 300 | `--text-lead` | 0.01em | italic | Light italic for "Develop your roll." and contextual taglines. The lightest weight at reading size — elegant and unhurried. |
| Body text | Body | 300 | `--text-body` | 0.005em | normal | Light weight creates dramatic contrast with display headings. Slight tracking opens the geometric letterforms for comfortable reading. |
| UI labels / nav | Body | 500 | `--text-label` | 0.04em | uppercase | Uppercase + wide tracking = a second hierarchy layer. Small caps energy without actual small caps. Navigation, pill text, section labels. |
| Buttons | Body | 600 | `--text-label` | 0.02em | normal | Semi-bold for primary actions. Not uppercase — buttons are verbs, not labels. |
| Frame counter "23/36" | Mono | 700 | `--text-lead` | 0.05em | normal | Bold mono = mechanical precision. The counter on a film canister. Space Mono's geometric quirks shine at this weight. |
| EXIF / timestamps | Mono | 400 | `--text-caption` | 0.02em | normal | Technical data deserves technical type. Camera model, shutter speed, date. |
| Metadata / captions | Body | 300 | `--text-caption` | 0.01em | normal | Light and small but readable. Photo dates, locations, roll status. |

### Responsive Type

```css
/* Fluid display type for hero moments */
.type-display {
  font-size: clamp(1.5rem, 3vw + 0.5rem, 1.875rem);
  line-height: 1.15;
  font-family: var(--font-display);
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Light italic for taglines and emotional copy */
.type-tagline {
  font-size: clamp(1.125rem, 2vw + 0.5rem, 1.5rem);
  line-height: 1.35;
  font-family: var(--font-display);
  font-weight: 300;
  font-style: italic;
  letter-spacing: 0.01em;
}

/* Body text: light weight, constrained reading width */
.type-body {
  font-size: var(--text-body);
  line-height: 1.65;
  max-width: 60ch;
  font-family: var(--font-body);
  font-weight: 300;
  letter-spacing: 0.005em;
}

/* UI labels: uppercase with wide tracking */
.type-label {
  font-size: var(--text-label);
  line-height: 1;
  font-family: var(--font-body);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
```

---

## 4. Surface Elevation System

**Depth strategy: surface color shifts + subtle warm shadows.** Not flat borders-only (too cold), not dramatic drops (too SaaS). The shadows use the darkroom color as their base — they're warm, not gray.

| Level | Surface | Shadow | Use |
|---|---|---|---|
| 0 — Canvas | `--color-surface` (paper) | none | Page background. The light table. |
| 1 — Raised | `--color-surface-raised` (paper-warm) | `--shadow-raised` | Cards, roll cards, panels. A print laid on the table. |
| 2 — Floating | `--color-surface` (paper) | `--shadow-floating` | Dropdowns, tooltips, popovers. Lifted above the surface. |
| 3 — Overlay | `--color-surface-overlay` (darkroom) | `--shadow-overlay` | Modals, lightbox, sheets. A separate dark space — the darkroom. |

**Key rule:** Sidebar and navigation use the SAME surface as canvas (Level 0), separated by a `--color-border` line. Never a different color — that fragments the space into "nav world" and "content world."

**Inputs are sunken:** Form inputs use `--color-surface-sunken` (kraft) — slightly darker than their surroundings to signal "type here" without heavy borders. The input is a receptacle, visually recessed.

---

## 5. Component Design Language

### 5.1 Buttons

**Primary (safelight):** The CTA button IS the safelight — the singular warm beacon in the interface. Terracotta background, cream text. When you see it, your eye goes there first.

```
Background: var(--color-action)
Text: var(--color-ink-inverse)
Padding: var(--space-element) var(--space-section)
Border-radius: var(--radius-sharp)
Font: body, 600, --text-label, tracking 0.02em
Hover: var(--color-action-hover) — the safelight dims slightly
Active: scale(0.98) — the button presses like a shutter release
Transition: background 150ms ease-out, transform 80ms ease-out
```

**Secondary (outlined):** Transparent, kraft border. Present but not competing with the safelight.

```
Background: transparent
Border: 1px solid var(--color-border-strong)
Text: var(--color-ink)
Hover: background var(--color-surface-raised)
```

**Ghost (text only):** For tertiary actions. Underline on hover — like a caption link in a photo book.

```
Background: transparent
Text: var(--color-ink-secondary)
Hover: color var(--color-ink), text-decoration underline
```

### 5.2 Checkmark Button — "This One"

The checkmark is Roll's primary gesture. It's the grease pencil circling a frame on the contact sheet. It must feel deliberate and satisfying.

**Unchecked state:**
```
Circle: 28px diameter
Background: oklch(0 0 0 / 0.3) — semi-transparent overlay on photo
Border: 2px solid white
Icon: none — an empty circle, a frame not yet chosen
Position: top-right, 8px inset from photo edge
```

**Checked state — "this one":**
```
Circle: 28px diameter
Background: var(--color-action) — the safelight fills the circle
Border: 2px solid var(--color-action)
Icon: white checkmark, 2px stroke
```

**The check animation — a satisfying click:**
```
1. scale(0.85) — press in, like clicking a shutter button (0–60ms, ease-in)
2. scale(1.1) — spring back past neutral (60–140ms, spring)
3. scale(1.0) — settle (140–200ms, ease-out)
Background fill: simultaneous with step 1, 80ms fade
```

**Why spring, not linear:** A mechanical click has rebound. The shutter button on a film camera presses, then springs back. The checkmark should feel the same — physical, not digital.

### 5.3 Heart Button — "Treasure This"

The heart appears only AFTER developing — it's the second gesture, the moment you decide a photo is special. Less frequent, more emotional.

**Unhearted:**
```
Icon: outlined heart, 24px, var(--color-ink-tertiary) — fixer silver, quiet
Hover: color var(--color-heart), scale(1.05) — warms up on approach
```

**Hearted — the moment of treasuring:**
```
Icon: filled heart, 24px, var(--color-heart) — warm, not aggressive red
Animation sequence:
  1. scale(0.7) — compress (0–80ms)
  2. scale(1.2) — burst outward (80–180ms, spring stiffness: 300, damping: 15)
  3. scale(1.0) — settle (180–300ms)
Particle burst: 6 mini-hearts at 60° intervals, fade + scale outward over 400ms
  Each particle: 6px, var(--color-heart), opacity 0.8 → 0
```

**Why particles on heart but not checkmark:** Checkmark is frequent and functional — "add to roll." Heart is rare and emotional — "I love this." The particle burst celebrates the emotional weight.

### 5.4 Film Strip Progress Bar — The Signature

This is the element that makes Roll, Roll. It's not a themed progress bar — it's a faithful evocation of a film strip, rendered as functional UI.

```
Container: full-width, 56px height, var(--color-filmstrip)
```

**Left zone — identity:**
```
"Roll 1" — display font, var(--color-ink-inverse), --text-label
Feels like the label hand-written on a film canister
```

**Center zone — exposure:**
```
Fill bar: var(--color-action), width = (currentCount / maxCount) × 100%
The fill represents exposed frames — amber, like light hitting emulsion
Transition: width 200ms ease-out (smooth as the counter advances)
```

**Right zone — counter:**
```
"23 / 36" — mono font, var(--color-framecounter), --text-lead, tracking 0.05em
The DX code on a film canister — mechanical, precise, satisfying to watch increment
```

**Sprocket holes — the signature detail:**
```
Pseudo-elements along top and bottom edges
4px circles, var(--color-sprocket), repeating every 16px
These are what make it a FILM STRIP, not just a progress bar
Purely decorative — hidden on mobile for space, visible on desktop
```

**Roll complete — 36/36:**
```
Golden shimmer: CSS gradient sweep (left → right, 600ms, ease-in-out)
  Background: linear-gradient translucent gold over the amber fill
Counter flash: opacity pulse 3× (300ms each) in var(--color-framecounter)
The emotional payoff — you finished a roll. Time to develop.
```

### 5.5 Content Mode Pills

```
Container: flex row, gap var(--space-tight), horizontal overflow scroll
Pill (inactive):
  Padding: var(--space-tight) var(--space-component)
  Background: var(--color-surface-raised)
  Text: var(--color-ink-secondary), --text-label
  Border-radius: var(--radius-pill)
Pill (active):
  Background: var(--color-ink)
  Text: var(--color-ink-inverse), font-weight 600
Transition: background 150ms ease-out, color 150ms ease-out
```

Labels: "All · People · Landscapes" — with photo counts inline: "People (142)"

### 5.6 Film Profile Card

Horizontal scroll during film selection — the moment of choosing your film stock.

```
Card: 160px wide, var(--radius-card)
Preview: sample photo with CSS filter applied, 160×120px, rounded top corners
Label: profile name, display font, --text-label, centered below preview
Badge: 6px circle of --color-stock-{name} — the film's signature color
Selected: 2px border var(--color-action), var(--shadow-raised)
Locked (free tier): 40% opacity overlay, lock icon center
```

### 5.7 Photo Card (Grid Cell)

In the grid, photos are presented like a contact sheet — tight, dense, edge-to-edge.

```
Container: aspect-ratio preserved, overflow hidden
Image: object-fit cover (grid), object-fit contain (lightbox)
Gap between cells: var(--space-micro) — 4px, like frames on a contact sheet
Checkmark: top-right, 8px inset (see 5.2)
Hover metadata: bottom gradient (darkroom → transparent), date + location in --text-caption
Long-press menu: "Hide · View detail · View cluster"
No border-radius on grid photos — contact sheets have sharp edges
```

### 5.8 Roll Card (Library)

A roll card represents a completed or in-progress roll of film — a physical artifact.

```
Container: var(--radius-card), var(--color-surface-raised), padding var(--space-component), var(--shadow-raised)
Header: roll name (display font, --text-lead) + film profile badge (6px dot)
Photo strip: horizontal scroll of 4–6 thumbnails, 80×80px each, var(--space-micro) gap
Footer: "36 photos · Warmth · Developed Feb 14" — --text-caption, var(--color-ink-tertiary)
Status badge:
  "Building" — var(--color-processing), filled dot
  "Ready" — var(--color-processing), pulsing dot
  "Processing" — var(--color-processing), animated spinner
  "Developed" — var(--color-developed), filled dot
  "Printed" — var(--color-action), filled dot
```

---

## 6. The Contact Sheet Grid

The photo grid is not a generic image gallery. It's a contact sheet — the analog tool photographers use to review an entire roll at once. This informs every decision.

**Why 4px gaps (not 8, not 12, not 16):** On a real contact sheet, frames nearly touch. The tiny gap lets photos breathe just enough to distinguish edges. Wider gaps make it feel like Pinterest. Tighter gaps make it feel like a collage. 4px is the contact sheet sweet spot.

**Why no border-radius on grid photos:** Contact sheets have sharp rectangular frames. Rounding corners would feel like Instagram. The grid is a tool for reviewing — utilitarian, not decorative.

**Why preserved aspect ratio (no cropping):** Every frame on a contact sheet shows the full image. Cropping loses information. The grid preserves what the photographer captured.

**Layout:**
```
Desktop (≥1024px): 3 columns — room to scan without scrolling endlessly
Tablet (768–1024px): 2 columns — still scannable, touch-friendly
Mobile (<768px): 2 columns — matched to thumb-reach for checkmarking
Gap: var(--space-micro) — 4px
Max content width: 1200px
```

---

## 7. Animations & Motion

### Motion Philosophy

Roll's motion language borrows from two physical sources: the **mechanical click** of camera controls (fast, precise, spring-back) and the **slow emergence** of an image in a developer tray (gradual, revealing, satisfying).

Quick interactions (checkmark, heart, toggle) = mechanical click: fast spring, slight overshoot, crisp.
Slow transitions (page changes, processing, developing) = chemical emergence: ease-out, gradual reveal, patience.

### Motion Scale

| Animation | Duration | Easing | Physical Source |
|---|---|---|---|
| Checkmark toggle | 200ms | spring(stiffness: 400, damping: 17) | Shutter button click — press and spring back |
| Heart toggle | 300ms | spring(stiffness: 300, damping: 15) | Longer because emotional, not mechanical |
| Heart particles | 400ms | ease-out | Emulsion spreading in developer fluid |
| Roll complete shimmer | 600ms | ease-in-out | Light catching the surface of a wet print |
| Counter flash (36/36) | 300ms × 3 | ease-in-out | Camera meter blinking at end of roll |
| Photo hide | 300ms | ease-in | Sliding a rejected print off the light table |
| Page transition | 250ms | cubic-bezier(0.16, 1, 0.3, 1) | Flipping a page in a photo book — decelerate into place |
| Modal/sheet open | 300ms | cubic-bezier(0.16, 1, 0.3, 1) | Darkroom door opening — decelerating swing |
| Progress bar fill | 200ms | ease-out | Smooth exposure meter needle |
| Skeleton pulse | 2000ms | ease-in-out infinite | Gentle breathing — the app is alive, waiting |

### Film Grain Texture

Subtle animated grain applied to background surfaces — the emulsion texture that makes Roll feel analog.

```css
.film-grain::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url('/textures/grain-light.webp');
  background-size: 200px;
  animation: grain-shift 0.5s steps(4) infinite;
  opacity: 0.04;  /* light mode: whisper-quiet */
  pointer-events: none;
  z-index: 1;
}

.dark .film-grain::after {
  opacity: 0.08;  /* dark mode: more visible, like actual film grain */
}

@keyframes grain-shift {
  0% { transform: translate(0, 0); }
  25% { transform: translate(-5%, -5%); }
  50% { transform: translate(5%, 0); }
  75% { transform: translate(0, 5%); }
  100% { transform: translate(0, 0); }
}

@media (prefers-reduced-motion: reduce) {
  .film-grain::after { animation: none; }
}
```

**Grain texture spec:** 200×200px tileable noise pattern. Monochromatic. Generated from actual film grain samples, not Perlin noise — the distribution matters.

---

## 8. Responsive Behavior

```css
@theme {
  --breakpoint-sm: 640px;   /* Mobile landscape */
  --breakpoint-md: 768px;   /* Tablet portrait */
  --breakpoint-lg: 1024px;  /* Tablet landscape / small desktop */
  --breakpoint-xl: 1280px;  /* Desktop */
}
```

### Mobile Adaptations

- **Photo grid:** 2 columns (thumb-reachable for checkmarking)
- **Film strip progress bar:** Simplified — counter + fill only, no sprocket decoration (too small)
- **Film profile selector:** Full-width horizontal scroll, edge-to-edge
- **Navigation:** Bottom-fixed tab bar, 56px, 4 icons + labels
- **Content pills:** Horizontally scrollable, inertia scroll
- **Page padding:** `var(--space-component)` (16px)

### Desktop Enhancements

- **Photo grid:** 3 columns with hover metadata overlay
- **Film strip progress bar:** Full decoration — sprocket holes, wider counter, roll name
- **Navigation:** Left sidebar (240px), same surface as canvas + border separator
- **Film profile selector:** Cards in a row, no scroll needed
- **Roll detail:** Side-by-side — photo grid (left) + metadata panel (right)
- **Page padding:** `var(--space-section)` (24px)

---

## 9. Accessibility

### Focus System

```css
/* The focus ring uses the safelight color — consistent with our accent system */
:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}

/* Minimum touch target: 44px — no exceptions */
.touch-target {
  min-width: 44px;
  min-height: 44px;
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --color-ink: #000000;
    --color-ink-secondary: #333333;
    --color-surface: #FFFFFF;
    --color-action: #B34426;
    --color-border: #333333;
  }
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  /* Film grain stops animating */
  .film-grain::after { animation: none; }
}
```

---

## 10. Iconography

Lucide icons throughout. **24px size, 1.5px stroke weight.** Icons clarify, they don't decorate — if removing an icon loses no meaning, remove it.

| Icon | Usage | Lucide Name | Context |
|---|---|---|---|
| Checkmark | Roll selection | `check` (in custom circle) | The primary gesture — always visible on feed photos |
| Heart | Favorites | `heart` | Second gesture — only appears post-development |
| Upload | Photo upload | `upload` | Onboarding + feed header |
| Grid | Feed tab | `grid-3x3` | Navigation — the contact sheet |
| Image | Library tab | `image` | Navigation — the photo album |
| Users | Circle tab | `users` | Navigation — the sharing group |
| Settings | Account tab | `settings` | Navigation |
| Film | Roll/profile indicator | `film` | Roll cards, film selection |
| Printer | Print order | `printer` | Developed roll CTA |
| Eye off | Hide photo | `eye-off` | Context menu action |
| Undo | Recover photo | `undo-2` | Filtered photos recovery |
| Share | Share to Circle | `share` | Post-development sharing |

---

## 11. Design System Tests

Before building, run these checks against any new component or screen:

**The swap test:** Replace Cormorant Garamond with Inter. Replace terracotta with blue. Replace the cream surface with white. Does the design still feel like Roll? If yes — you defaulted somewhere. Find it.

**The token test:** Read the CSS variables out loud. `--color-safelight`, `--color-paper`, `--color-filmstrip`, `--color-framecounter`. Someone reading only these tokens should be able to guess this is a film photography app.

**The signature test:** Can you point to the film strip progress bar, the contact sheet grid gaps, the serif logotype, the grease-pencil checkmark, and the grain texture? If your screen doesn't contain at least two of these, it's missing Roll's identity.

**The squint test:** Blur your eyes at the screen. You should perceive: warm surface, one amber accent pulling focus, dense photo grid, and quiet structure everywhere else. If anything jumps harshly or the accent is competing with other colors, recalibrate.
