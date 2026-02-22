# Roll — Frontend Specification

> Component architecture, routing, page choreography, state management, and performance budgets for the Next.js web prototype. Every spec here connects to `rollDESIGN_SYSTEM.md` — if a token name appears, it's defined there.

---

## 1. Routing Architecture

Roll uses the Next.js App Router with route groups for authentication boundaries.

### 1.1 Route Map

```
/                           → Landing/marketing page (public)
/(auth)/login               → Email + magic link sign-in
/(auth)/callback            → Magic link redirect handler
/(app)/feed                 → Tab 1: Filtered photo feed (authenticated)
/(app)/library              → Tab 2: Developed rolls + Favorites (authenticated)
/(app)/circle               → Tab 3: Private sharing feed (authenticated)
/(app)/account              → Tab 4: Settings, subscription, history (authenticated)
/(app)/upload               → Photo upload interface (authenticated)
/(app)/onboarding           → First-run experience (authenticated, first visit only)
/(app)/roll/[id]            → Roll detail/review (authenticated)
/(app)/roll/develop         → Film stock selection + processing trigger (authenticated)
```

### 1.2 Route Groups

**`(auth)` group:**
- No app shell or tab bar
- Minimal layout: centered card on `--color-surface` (cream) with film grain overlay (see `rollDESIGN_SYSTEM.md` Section 7 — Film Grain Texture)
- Redirects to `/feed` if user already has a session

**`(app)` group:**
- Shared layout with `AppShell.tsx`: bottom tab bar (mobile), sidebar nav (desktop)
- Auth middleware: redirects to `/login` if no session
- First-visit detection: redirects to `/onboarding` if user has zero photos

### 1.3 Middleware

```typescript
// src/lib/supabase/middleware.ts
// Runs on every request to (app) routes
// 1. Refresh Supabase session (token rotation)
// 2. If no session → redirect to /login
// 3. If session + zero photos + not on /onboarding → redirect to /onboarding
```

### 1.4 Page Transition Choreography

Every route change follows the "page flip" pattern — a photography book turning. Not a hard cut, not a fade.

```
Exiting page:  opacity 1 → 0, translateY(0) → translateY(-8px)
               Duration: 120ms, ease-in
Entering page: opacity 0 → 1, translateY(8px) → translateY(0)
               Duration: 250ms, cubic-bezier(0.16, 1, 0.3, 1) — decelerate into place
```

WHY this easing: A page in a photo book doesn't pop — it settles. The deceleration creates that physical arrival feeling.

Tab bar navigation has NO transition — tabs switch instantly. Only route-to-route navigation within a tab animates (e.g., feed → roll detail).

---

## 2. Page Specifications

### 2.1 Landing Page (`/`)

**Purpose:** Marketing page for non-authenticated visitors.
**Render strategy:** Static (SSG) — no dynamic data.
**See:** `rollLANDING_PAGE.md` for full content and layout specs.

### 2.2 Login (`/(auth)/login`)

**Purpose:** Email-based authentication — the entrance to the darkroom.
**Render strategy:** Client component (form interaction).
**Emotional intent:** Calm, focused, inviting. One warm amber action in a sea of quiet cream. Like stepping into a photographer's studio — not a SaaS login wall.

**Layout:**
- Full viewport height, centered both axes
- Surface: `--color-surface` with `.film-grain` overlay at `opacity: 0.04`
- Content container: max-width 400px, no card border (the surface IS the card)

**Elements (top → bottom, spaced with `--space-section`):**
1. **"ROLL" logotype** — Cormorant Garamond 700, `--text-logotype` (3rem), `tracking-[0.15em]`, `--color-ink`. The wide tracking evokes engraved metal on a camera body.
2. **Tagline** — "Develop your roll." — Cormorant Garamond 300 italic, `--text-lead`, `--color-ink-secondary`. Period included — it's a statement, not a question. Light italic serif = quiet confidence.
3. **Email input** — full width, `--color-surface-sunken` background, `--radius-sharp`, height 48px, padding `--space-element` horizontal. Placeholder: "your@email.com" in `--color-ink-tertiary`.
4. **"Send Magic Link" button** — primary CTA, full width, 48px height. The safelight — the only amber on the page. Uses primary button spec from `rollDESIGN_SYSTEM.md` Section 5.1.
5. **Divider** — "or" text centered on a horizontal `--color-border` line.
6. **"Sign in with password"** — ghost button (text link style). For users who set a password during prototype testing.
7. **Footer** — "New here? We'll create your account automatically." — `--text-caption`, `--color-ink-tertiary`.

**States and transitions:**
- **Default:** Form ready, button resting
- **Loading:** Button shows a 16px spinner (amber on cream), email input visually disabled (`opacity: 0.6`). Button text fades to "Sending…" — 150ms crossfade
- **Success:** Input + button fade out (200ms), replaced by a check icon + "Check your email for a magic link" — fades in with the chemical-emergence timing (250ms ease-out). The check icon is `--color-developed` (green), confirming the action landed.
- **Error:** Input border shifts to `--color-error` (safelight color — urgency shares the accent). Error text appears below in `--text-caption` with a 150ms slide-down: "Invalid email" or "Something went wrong, try again."

### 2.3 Auth Callback (`/(auth)/callback`)

**Purpose:** Handle magic link redirect from email.
**Render strategy:** Server component.

**Flow:**
1. Extract `code` from URL search params
2. Exchange code for Supabase session via `exchangeCodeForSession()`
3. Check if user has photos → redirect to `/feed` or `/onboarding`

**Visual during processing:** Centered "ROLL" logotype + a small amber spinner below. The grain texture animates. This lasts 1–3 seconds — short enough that no loading message is needed.

**Error state:** If code is invalid or expired, the logotype stays, a red-tinted message fades in: "This link has expired." Below: "Request a new link" button (primary CTA, navigates to `/login`).

### 2.4 Onboarding (`/(app)/onboarding`)

**Purpose:** First-run experience — the user loads their first roll of film.
**Render strategy:** Client component (multi-step wizard).
**Emotional arc:** Anticipation → patience → revelation → understanding.

**Steps:**

| Step | Component | Emotional Beat | Content |
|---|---|---|---|
| 1 | `OnboardingUpload` | Anticipation — loading the camera | "Upload your photos and we'll clean up the noise." Large drag-and-drop zone (200px+ height) with dashed `--color-border-strong` border. File picker button below. Drop zone pulses subtly on drag-over (`--color-action-subtle` background fade). |
| 2 | `OnboardingProcessing` | Patience — developing film | "Cleaning up your library…" Animated film roll loader (CSS keyframes rotating a film reel icon). Progress counter: "Analyzed 47 of 132 photos" in mono font. The counter ticks like a film counter advancing. |
| 3 | `OnboardingResult` | Revelation — seeing your prints | "We removed [N] screenshots, duplicates, and blurry shots. Here's what's worth keeping." Preview grid: 6 filtered photos in a 3×2 contact-sheet mini-grid (4px gaps, no border-radius). CTA: "Start picking your favorites →" (primary button). |
| 4 | `OnboardingTutorial` | Understanding — learning the gestures | Brief overlay on the feed page. Two gesture cards side by side: "✓ Checkmark photos to fill your roll" (shows checkmark animation once) and "♥ Heart your favorites after developing" (shows heart animation once). Dismiss: "Got it" button (ghost style). |

**Step transition:** Each step fades out (200ms) and the next slides up (250ms, cubic-bezier deceleration). No back button on steps 1–3 — the process is linear like developing film, you can't un-expose it.

**Step 4** is a semi-transparent overlay on the feed (`--color-surface-overlay` at `opacity: 0.85`). Shown once, then `onboarding_complete` flag set in user profile. Dismisses with the "darkroom door closing" animation (slide down + fade, 300ms).

### 2.5 Feed (`/(app)/feed`)

**Purpose:** The contact sheet — a dense grid of filtered photos where users browse and mark their selections.
**Render strategy:** Server component for initial data, client components for interaction.
**Emotional intent:** Focused browsing. The grid is utilitarian — a tool for reviewing, not a gallery for admiring. Checkmarks are the only color events in the grid.

**Layout (top → bottom):**

1. **Header area:**
   - Page title: "Your Photos" — display font (`--font-display`), 500 weight, `--text-title`
   - Upload button (Lucide `upload` icon + "Upload" label) — positioned top-right, secondary button style
   - `ContentModePills` below title: "All · People · Landscapes" — horizontally scrollable with `--space-tight` gap
   - Header separated from grid by `--space-section` (24px)

2. **Photo grid — the contact sheet:**
   - Rendered by `PhotoGrid` component (Section 3.3)
   - 3 columns desktop, 2 columns mobile
   - Gap: `--space-micro` (4px) — the contact sheet gap. See `rollDESIGN_SYSTEM.md` Section 6 for why.
   - No border-radius on photos — contact sheet edges are sharp
   - Each cell: `PhotoCard` in `mode="feed"` (checkmark overlay visible)
   - LQIP: 20px-wide blurred thumbnail placeholder. Each photo fades from blur → sharp over 200ms (the chemical-emergence timing) on load.
   - Initial load: 30 photos. Infinite scroll loads 30 more.

3. **Roll progress bar (fixed bottom):**
   - `FilmStripProgress` component (Section 3.4) — the signature element
   - Fixed above the tab bar (mobile) or pinned to bottom of content area (desktop)
   - z-index above content, below overlays
   - Always visible when on Feed tab — it's the ambient reminder that you're building a roll

**Data fetching:**
```typescript
// Initial load: Server Component
const { data: photos } = await supabase
  .from('photos')
  .select('id, thumbnail_url, filter_status, face_count, scene_classification, created_at')
  .eq('user_id', userId)
  .eq('filter_status', 'visible')
  .order('created_at', { ascending: false })
  .range(0, 29);
```

**Content mode filtering:**
- "All": no additional filter (default)
- "People": `face_count > 0`
- "Landscapes": `face_count = 0 AND 'landscape' = ANY(scene_classification)`
- Mode persists in `filterStore` (Zustand + localStorage). Switching modes re-fetches with the chemical-emergence fade (grid crossfades over 200ms).

**Empty states** (each uses centered layout with Lucide icon at 48px in `--color-ink-tertiary`):
- No photos at all: `upload` icon + "Upload your first photos to get started." + primary CTA
- No photos in current mode: `eye-off` icon + "No [people/landscape] photos found. Try uploading more or switch to All."
- All photos checkmarked: `check` icon + "You've been through everything! Upload more photos or develop your roll."

### 2.6 Library (`/(app)/library`)

**Purpose:** The archive — developed rolls and treasured favorites.
**Render strategy:** Server component for data, client for section toggle.
**Emotional intent:** Accomplishment and memory. Rolls are physical artifacts on display. Favorites are the curated best — a personal gallery.

**Layout:**

1. **Section toggle:** "Rolls · Favorites" — two pills at top (same component as `ContentModePills`, but binary). Rolls is the default view.

2. **Rolls section:**
   - Vertical list of `RollCard` components, newest first
   - Each card: roll name (display font), film profile badge (6px colored dot from `--color-stock-{name}`), thumbnail strip (4–6 photos, 80×80px, horizontal scroll), photo count, date, status badge
   - Status badges with emotional color coding:
     - "Building" — `--color-processing` (amber) solid dot. You're still filling this roll.
     - "Ready to Develop" — `--color-processing` pulsing dot. The roll is full — it's waiting for you.
     - "Processing" — `--color-processing` animated spinner. Film is in the developer tray.
     - "Developed" — `--color-developed` (green) solid dot. Your prints are ready.
     - "Printed" — `--color-action` (terracotta) solid dot. Physical prints ordered — the full circle.
   - Tap a roll → navigates to `/roll/[id]` with the page-flip transition

3. **Favorites section:**
   - Same contact-sheet grid as Feed (3-col desktop, 2-col mobile, `--space-micro` gap)
   - Only hearted photos, displayed with a filled heart in `--color-heart` (top-right overlay)
   - No checkmark overlay — hearts only. The gesture here is un-hearting (rare).
   - Empty state: `heart` icon + "Heart your favorite photos after developing a roll. They'll collect here."

### 2.7 Roll Detail (`/(app)/roll/[id]`)

**Purpose:** View and manage a single roll — before, during, and after developing.
**Render strategy:** Server component for data, client for interactions.
**Emotional intent:** Depends on state. Pre-develop = curation mode (focused, deliberate). Processing = anticipation (the wait). Post-develop = pride (the reveal).

**Pre-development state (status: "pending" or "ready"):**
- Header: roll name (display font, `--text-display`) + "23 / 36" counter (mono font, `--text-lead`)
- Grid of selected photos in a contact sheet layout
- Drag-to-reorder: desktop uses drag handle icon (right edge), mobile uses long-press-drag
- Swipe-to-remove: photo slides off with the "rejected print" animation (`ease-in`, 300ms, slide left + fade). Returns to feed. Toast: "Photo removed from roll" with `Undo` action (5 seconds).
- "Develop" CTA button at bottom (primary button, full width). Disabled state if < 10 photos — `opacity: 0.5`, tooltip on tap: "Add at least 10 photos to develop."
- When roll hits 36/36: the Develop button pulses with `--color-action-subtle` background, encouraging the user to proceed. The film strip (if visible) plays the completion shimmer.

**Processing state (status: "processing"):**
- The contact sheet grid remains visible but dimmed (`opacity: 0.5`)
- Centered overlay: animated film reel icon (rotating) + "Processing photo 12 of 36…" (mono font, counter ticking)
- Below: "Estimated time: ~2 minutes" in `--color-ink-tertiary`
- The progress is the chemical emergence — patient, not frantic. No spinning wheels. The reel rotates slowly (4s per revolution).

**Post-development state (status: "developed"):**
- The reveal moment. Grid fades in over 600ms with a slight `brightness(1.1) → brightness(1.0)` shift — like a print emerging in the developer tray.
- Photos now show the film profile applied (LUT + grain + vignette)
- Heart button visible on each photo (unhearted state initially)
- Film profile badge in header: profile name + colored dot
- CTAs at bottom:
  - "Order Prints" — primary button (the safelight) with `printer` icon
  - "Share to Circle" — secondary button with `share` icon
- No more reorder/remove — the roll is developed. It's permanent, like a finished print.

### 2.8 Film Selection (`/(app)/roll/develop`)

**Purpose:** Choose your film stock — one of Roll's signature moments.
**Render strategy:** Client component.
**Emotional intent:** Anticipation and delight. This is the moment before developing — choosing the look that will define your memories. The preview should feel playful, not technical.

**Layout (top → bottom):**
1. **Header:** Roll name (display font) + photo count in mono
2. **Sample photo:** The roll's best photo (highest `aesthetic_score`) displayed large, with soft `--shadow-floating` — a print lifted off the table for inspection
3. **Film profile selector:** `FilmProfileSelector` component (Section 3.8) — horizontal scroll of `FilmProfileCard` components
   - Each card shows the sample photo with that profile's CSS filter applied
   - Tapping a card applies the filter to the large preview in real-time (200ms crossfade)
   - The preview is emotional, not pixel-accurate — CSS filters approximate the final LUT
4. **"Develop This Roll"** — primary CTA, full width. The single amber action on the page.
5. **Processing time estimate:** "~2 minutes for 36 photos" in `--text-caption`, `--color-ink-tertiary`

**CSS filter previews** (client-side approximations, NOT final output):
```css
.preview-warmth   { filter: saturate(1.1) sepia(0.15) brightness(1.05); }
.preview-golden   { filter: saturate(1.2) sepia(0.25) brightness(1.08) contrast(1.05); }
.preview-vivid    { filter: saturate(1.4) contrast(1.1) brightness(1.02); }
.preview-classic  { filter: grayscale(1) contrast(1.3) brightness(0.95); }
.preview-gentle   { filter: grayscale(1) contrast(0.9) brightness(1.1); }
.preview-modern   { filter: grayscale(1) contrast(1.1) brightness(1.0); }
```

### 2.9 Circle (`/(app)/circle`)

**Purpose:** Private sharing — showing your best prints to the people who matter.
**Render strategy:** Server component for data, client for interactions.
**Emotional intent:** Intimate, warm. Not a social media feed — a family photo table. Reactions are gentle, not performative.

**Layout:**
1. Circle name header (display font) + member avatars (max 5 visible + "+N" overflow badge)
2. Chronological feed of shared photos (newest first)
3. Each `CircleCard`: photo(s) displayed in a mini-grid (if multiple), sharer name + avatar, timestamp in mono, reaction buttons
4. Reactions: heart, smile, wow — simple taps, count displayed. No elaborate animations — this is about connection, not engagement metrics.
5. Floating action button: "Share to Circle" — a 56px circle, `--color-action` background, `share` icon in `--color-ink-inverse`. Positioned bottom-right, above tab bar. Opens a bottom sheet for selecting from recent Favorites.

**States:**
- No circles: `users` icon + "Create a Circle to share your best photos with family and friends." + "Create Circle" CTA (Roll+ only)
- Circle with no posts: `image` icon + "No photos shared yet. Develop a roll and share your favorites."
- Free tier: can view, react, order prints. Cannot create circles or share. Sharing button shows upgrade prompt toast.

### 2.10 Account (`/(app)/account`)

**Purpose:** Settings and history — the back-of-house.
**Render strategy:** Server component.
**Emotional intent:** Clean, administrative. No decorative elements. Cards on `--color-surface-raised` (paper-warm) separate each section.

**Sections (each in its own card):**
1. **Profile:** Email, avatar (initial-based, circular, `--color-surface-sunken` background), member-since date in mono
2. **Subscription:** Current tier (Free/Roll+), toggle switch for prototype tier testing, feature comparison table
3. **Print History:** List of past orders — each row: order date (mono), photo count, status, tracking link (`ghost` button style)
4. **Filtered Photos:** Gallery grid of auto-filtered and manually hidden photos. Each photo has a "Recover" button (secondary style). Recovered photos slide back to feed with the page-flip transition.
5. **Storage:** Usage bar — fills with `--color-action` on `--color-surface-sunken` track. "47 / 100 photos backed up" (free) or "Unlimited" (Roll+)
6. **Sign Out:** Destructive action button (terracotta background, same as primary but contextually dangerous). Confirmation modal before execution.

---

## 3. Component Specifications

### 3.1 `AppShell` (Layout)

Wraps all `(app)` routes. Provides the navigation frame around content.

```typescript
interface AppShellProps {
  children: React.ReactNode;
}
```

**Mobile (< 1024px):** Bottom-fixed tab bar, 56px height, `--color-surface` background with `--color-border` top edge. This sits on the canvas — not a raised card. Same surface, separated by a hairline.

- 4 tabs: Feed (`grid-3x3`), Library (`image`), Circle (`users`), Account (`settings`)
- Active tab: icon + label in `--color-action` (the safelight color). Inactive: `--color-ink-tertiary`
- Labels in `--text-caption`, font-weight 500
- Tab switch is instant — no transition. Tabs are spatial, not sequential.

**Desktop (≥ 1024px):** Left sidebar, 240px width, `--color-surface` background with `--color-border` right edge. Same surface as canvas — following the design system rule that nav never uses a different color.

- "ROLL" logotype at top: display font, `--text-heading` size, `--color-ink`
- 4 nav items as vertical list: icon + label, `--space-element` gap between items
- Active item: `--color-action` text + icon, `--color-action-subtle` background pill
- Upload button below nav: secondary button style, full sidebar width minus padding

### 3.2 `PhotoCard`

A single photo in the contact sheet grid. The fundamental unit of Roll's UI.

```typescript
interface PhotoCardProps {
  photo: {
    id: string;
    thumbnail_url: string;
    lqip_data_url: string; // Base64 20px blurred placeholder
    created_at: string;
    location?: string;
    face_count: number;
  };
  isChecked: boolean;
  isFavorite: boolean;
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  onCheck?: () => void;
  onHeart?: () => void;
  onHide?: () => void;
  onTap?: () => void;
}
```

**Image loading sequence — the chemical emergence:**
1. Render immediately with `lqip_data_url` as `src` — a 20px blurred thumbnail, stretched to fill. No layout shift because aspect ratio is reserved.
2. Load full thumbnail (400px WebP) with native `loading="lazy"`.
3. On load, crossfade from LQIP → sharp over 200ms (ease-out). The image appears like a print developing — it doesn't pop in, it resolves.

**Mode-specific overlays:**
- **Feed:** `CheckmarkButton` top-right, 8px inset. This is the primary interaction surface. Tap anywhere else on the photo → opens `PhotoLightbox`.
- **Roll:** Position number badge top-left (mono font, `--color-ink-inverse` on `--color-surface-overlay` pill). Drag handle icon right edge (desktop). Swipe-to-remove gesture (mobile).
- **Favorites:** Filled `HeartButton` top-right. Tap photo → lightbox.
- **Circle:** No overlay buttons. Tap → lightbox.

**Hover state (desktop only):** Bottom gradient overlay (transparent → `--color-darkroom` at 60% opacity) slides up over 200ms. Shows: date + location in `--text-caption`, `--color-ink-inverse`.

**Long-press menu (mobile):** After 500ms hold — slight scale(0.97) + haptic feedback. Menu: "Hide · View detail · View cluster" in a floating card (`--shadow-floating`).

### 3.3 `PhotoGrid`

The contact sheet — a virtualized grid that shows photos the way a photographer reviews film.

```typescript
interface PhotoGridProps {
  photos: Photo[];
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
}
```

**Virtualization:** CSS `content-visibility: auto` on row containers. Simpler than `react-window`, sufficient for prototype. Each row is a flex container of `PhotoCard` components.

**Layout:**
- 3 columns desktop (≥ 1024px), 2 columns mobile (< 1024px)
- Gap: `--space-micro` (4px) — the contact sheet gap
- No border-radius on cells — sharp edges, per design system Section 6
- Max content width: 1200px, centered

**Infinite scroll:** `IntersectionObserver` on a sentinel `<div>` positioned 5 rows from the bottom. When visible → trigger `onLoadMore`. New photos append with a staggered fade-in (each photo delayed by 30ms × index, 200ms ease-out).

**Loading state:** 6 skeleton cards — `--color-surface-sunken` rectangles with the skeleton pulse animation (2000ms ease-in-out infinite). Preserves the grid layout during loading.

**Empty state:** Full-width centered content (icon + text + CTA). See page-specific empty states in Section 2.

### 3.4 `FilmStripProgress`

Roll's signature element. See `rollDESIGN_SYSTEM.md` Section 5.4 for the complete design specification.

```typescript
interface FilmStripProgressProps {
  rollName: string;
  currentCount: number;
  maxCount: number; // 36
  onTap?: () => void; // Navigate to roll detail
}
```

**Positioning:**
- Mobile: fixed above tab bar (bottom: 56px), full width. The strip sits between content and navigation.
- Desktop: pinned to bottom of content area (not viewport-fixed). Respects sidebar layout.

**Interaction:** Tap/click anywhere on the strip → navigates to the active roll detail (`/roll/[id]`). Cursor: pointer. Hover: subtle `brightness(1.05)` shift.

**Responsive adaptation:**
- Mobile: simplified — roll name (truncated), fill bar, and counter only. No sprocket decoration (too small at this scale).
- Desktop: full decoration — sprocket holes along top/bottom edges (4px circles, `--color-sprocket`, repeating every 16px via background-image), roll name, fill bar, and counter.

**The 36/36 completion moment:**
- Golden shimmer: CSS gradient sweep (linear-gradient of translucent gold, slides left→right over 600ms ease-in-out)
- Counter flash: opacity pulses 3× (300ms each) in `--color-framecounter`
- This is a celebration. The user just finished a roll. The strip should feel alive.

### 3.5 `CheckmarkButton`

The grease pencil — Roll's primary gesture. See `rollDESIGN_SYSTEM.md` Section 5.2.

```typescript
interface CheckmarkButtonProps {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean; // True if roll is full (36/36) and this photo isn't already checked
}
```

**Accessibility:**
- `role="checkbox"`, `aria-checked={isChecked}`
- `aria-label="Select photo for roll"` (unchecked) / `aria-label="Remove photo from roll"` (checked)
- Keyboard: Space/Enter to toggle
- Focus ring: `--color-border-focus` (safelight), 2px outline, 2px offset

**Disabled state:** When the roll is full and this photo isn't checked — the circle becomes `opacity: 0.3`. Tapping shows a toast: "Your roll is full. Remove a photo or develop it."

### 3.6 `HeartButton`

The treasuring gesture — appears only after developing. See `rollDESIGN_SYSTEM.md` Section 5.3.

```typescript
interface HeartButtonProps {
  isHearted: boolean;
  onChange: (hearted: boolean) => void;
  count?: number; // For circle mode: number of hearts from others
}
```

**The particle burst:** When hearting, 6 mini-hearts (6px each, `--color-heart`) emit at 60° intervals from the center. Each particle: fade from `opacity: 0.8 → 0`, scale from `1 → 0.5`, translate outward by 16px. Duration: 400ms ease-out. This uses CSS `@keyframes` — no JS animation library needed.

**Circle mode extension:** When `count` is provided, display the count next to the heart in `--text-caption`, `--color-ink-tertiary`. Other people's hearts are shown as a number, not animated.

**Accessibility:**
- `role="checkbox"`, `aria-checked={isHearted}`
- `aria-label="Mark as favorite"` / `aria-label="Remove from favorites"`

### 3.7 `ContentModePills`

Filter pills for content modes and section toggles.

```typescript
interface ContentModePillsProps {
  activeMode: string;
  onChange: (mode: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
}
```

**Visual spec:** See `rollDESIGN_SYSTEM.md` Section 5.5. Active pill inverts: `--color-ink` background, `--color-ink-inverse` text. Inactive: `--color-surface-raised` background, `--color-ink-secondary` text. Transition: background + color 150ms ease-out.

**When counts are present:** Label + count inline: "People (142)" in parentheses. Count uses the same font weight — not emphasized.

**ARIA:** `role="tablist"` on container, each pill `role="tab"` with `aria-selected`. Keyboard: Left/Right arrows cycle, Enter/Space selects.

### 3.8 `FilmProfileSelector`

The film stock chooser — the moment before developing.

```typescript
interface FilmProfileSelectorProps {
  profiles: FilmProfile[];
  selectedId: string;
  onChange: (profileId: string) => void;
  samplePhotoUrl: string;
  userTier: 'free' | 'plus';
}
```

**Layout:** Horizontal scroll container (overflow-x auto, snap to cards). Each card is 160px wide. Gap: `--space-element`.

**Card anatomy:** See `rollDESIGN_SYSTEM.md` Section 5.6. Preview image (160×120px, rounded top corners with `--radius-card`) + profile name (display font, `--text-label`, centered) + signature color dot (6px, `--color-stock-{name}`).

**Selection feedback:** Border shifts to `--color-action` (2px) + `--shadow-raised` appears. Transition: 150ms. The selected card asserts itself without shouting.

**Locked profiles (free tier):** 40% opacity overlay. Lock icon centered. Tap → toast: "Upgrade to Roll+ to unlock all film profiles" with an upgrade link.

### 3.9 `PhotoLightbox`

Full-screen photo viewer — the enlarger.

```typescript
interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  mode: 'feed' | 'roll' | 'favorites' | 'circle';
}
```

**Opening animation:** The photo scales from its grid position to full-screen (shared element transition feel). Background fades to `--color-surface-overlay` (darkroom). Duration: 300ms, cubic-bezier(0.16, 1, 0.3, 1). The darkroom envelops the photo.

**Navigation:** Swipe left/right (touch) or arrow keys (keyboard). Each transition: slide + slight scale dip (0.95 → 1.0) over 250ms — like sliding a print across the table.

**Close:** X button top-right (ghost button, `--color-ink-inverse`). Swipe down. Escape key. The photo shrinks back (reverse of open). Focus returns to the triggering grid cell.

**Photo display:** `object-fit: contain` — full image visible, no cropping. Background: `--color-surface-overlay`.

**Metadata bar (bottom):** Date, location, camera info in mono font, `--text-caption`, `--color-ink-tertiary`. Fades in 200ms after the photo settles.

**Mode-specific actions (below metadata):**
- Feed: `CheckmarkButton`
- Roll/Favorites: `HeartButton`
- Circle: reaction buttons (heart, smile, wow)

### 3.10 `Toast`

Non-blocking notification — a brief message that appears and dissolves, like a timer beeping in the darkroom.

```typescript
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number; // Default 3000ms
  action?: { label: string; onClick: () => void };
}
```

**Position:** Top-center (mobile), top-right (desktop). Offset from top: `--space-section`.

**Enter:** Slide down from top + fade in, 200ms, cubic-bezier deceleration.
**Exit:** Fade out + slide up slightly, 150ms, ease-in.

**Visual:**
- Background: `--color-surface-raised`, `--shadow-floating`, `--radius-card`
- Text: `--color-ink`, `--text-label`
- Success: Left border accent in `--color-developed` (green timer indicator)
- Error: Left border accent in `--color-error` (safelight urgency)
- Info: Left border accent in `--color-fixer` (silver — neutral)
- Action button (e.g., "Undo"): ghost style, `--color-action` text

---

## 4. State Management

### 4.1 Zustand Stores

**`photoStore`** — The photo library

```typescript
interface PhotoStore {
  photos: Map<string, Photo>;
  filterMode: 'all' | 'people' | 'landscapes';
  loadingState: 'idle' | 'loading' | 'error';
  cursor: string | null;

  setFilterMode: (mode: 'all' | 'people' | 'landscapes') => void;
  loadPhotos: (append?: boolean) => Promise<void>;
  hidePhoto: (photoId: string) => Promise<void>;
  recoverPhoto: (photoId: string) => Promise<void>;
}
```

**`rollStore`** — Roll building (the core creative loop)

```typescript
interface RollStore {
  activeRoll: Roll | null;
  checkedPhotoIds: Set<string>;

  checkPhoto: (photoId: string) => void;      // Add to roll — the "this one" moment
  uncheckPhoto: (photoId: string) => void;     // Remove — second thoughts
  isChecked: (photoId: string) => boolean;
  closeRoll: () => Promise<void>;              // Finalize roll at 36
  createNewRoll: () => void;                   // Start a fresh roll
  reorderPhotos: (fromIndex: number, toIndex: number) => void;
  removeFromRoll: (photoId: string) => void;   // Swipe-to-remove
}
```

**`userStore`** — Auth and preferences

```typescript
interface UserStore {
  user: User | null;
  tier: 'free' | 'plus';
  onboardingComplete: boolean;

  setTier: (tier: 'free' | 'plus') => void; // Prototype toggle
  signOut: () => Promise<void>;
}
```

**`filterStore`** — Content mode persistence

```typescript
interface FilterStore {
  contentMode: 'all' | 'people' | 'landscapes';
  setContentMode: (mode: 'all' | 'people' | 'landscapes') => void;
}
// Persisted to localStorage via zustand/middleware
```

### 4.2 Server State Pattern

For data from Supabase that needs caching and revalidation:

- **Initial load:** React Server Components fetch data (SSR). No client-side fetching on first paint.
- **Hydration:** Server-fetched data passed to client components as props. Client components hydrate Zustand stores with this data.
- **Live updates:** Supabase Realtime subscriptions for changes triggered by other devices/sessions (e.g., processing completion).
- **After mutations:** `router.refresh()` to revalidate server component data. No SWR library needed for prototype — server components + optimistic updates cover the use case.

### 4.3 Optimistic Updates

Every user action must feel instant. Network happens in the background. Revert on failure.

| Action | Optimistic Behavior | Background | Failure |
|---|---|---|---|
| Checkmark toggle | Immediately add/remove from `rollStore.checkedPhotoIds`. Checkmark animation plays. Film strip counter updates. | Supabase insert/delete on `roll_photos` | Revert set + show error toast |
| Heart toggle | Immediately fill/unfill heart. Particle burst plays. | Supabase update on `photos.is_favorite` | Revert + error toast |
| Hide photo | Immediately remove from grid with exit animation (slide-left, 300ms). Show "Undo" toast for 5s. | Supabase update on `photos.filter_status` | Revert — photo slides back in |
| Roll reorder | Immediately reorder in local state. | Debounced Supabase update (1s) on `roll_photos.position` | Revert to last saved order |

---

## 5. Performance Budgets

These aren't generic targets — they're calibrated to Roll's use case: photo-heavy grids where perceived speed matters more than raw metrics.

### 5.1 Core Web Vitals

| Metric | Target | Roll-Specific Strategy |
|---|---|---|
| First Contentful Paint | < 1.5s | SSR the first 30 photo thumbnails. The cream surface + logotype renders before images. |
| Largest Contentful Paint | < 2.5s | LQIP placeholders are inline base64 — they render with HTML. Real thumbnails lazy-load from CDN. |
| Cumulative Layout Shift | < 0.1 | Every photo cell reserves aspect ratio via CSS `aspect-ratio`. Film strip is fixed-height (56px). Skeleton cards match final dimensions. |
| Interaction to Next Paint | < 200ms | Checkmark and heart are optimistic — no network before visual update. Zustand state updates are synchronous. |
| Time to Interactive | < 3s | Code split: lightbox, film selector, circle features load on demand. Feed page JS is minimal. |

### 5.2 Bundle Budget

| Chunk | Max Size | What's In It |
|---|---|---|
| Initial JS (framework + critical) | 120KB gzipped | Next.js runtime, Supabase client, Zustand stores, AppShell |
| Feed page chunk | 40KB gzipped | PhotoGrid, PhotoCard, CheckmarkButton, ContentModePills, FilmStripProgress |
| Library page chunk | 30KB gzipped | RollCard, section toggle, favorites grid |
| Film profile selector | 15KB gzipped | FilmProfileCard, CSS filter previews, profile data |
| Photo lightbox | 20KB gzipped | Full-screen viewer, swipe gestures, metadata display |
| **Total initial load** | **< 200KB gzipped** | Everything needed for the feed to be interactive |

### 5.3 Image Loading Strategy

1. **Grid thumbnails:** WebP, 400px wide, quality 80. Served from Cloudflare R2 public URL with CDN caching (1 year, immutable).
2. **LQIP placeholders:** 20px wide blurred WebP, base64-encoded, stored in photo record. Inline in HTML — zero network requests for placeholders.
3. **Full resolution:** Loaded on-demand in lightbox only. Progressive JPEG, max 4000px long edge. Progressive encoding ensures the image refines visually (another chemical-emergence moment).
4. **Lazy loading:** Native `loading="lazy"` on all grid `<img>` tags + `IntersectionObserver` pre-fetching 2 rows ahead. Avoids loading below-the-fold images on initial paint.

---

## 6. Error Handling

### 6.1 Error Boundaries

Each page route wrapped in a React Error Boundary. Errors don't crash the whole app — they crash one tab.

```typescript
// src/app/(app)/feed/error.tsx
export default function FeedError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-[--space-section]">
      <p className="text-[--color-ink-secondary] font-[--font-body] text-[--text-body]">
        Something went wrong loading your photos.
      </p>
      <Button variant="primary" onClick={reset}>Try again</Button>
    </div>
  );
}
```

### 6.2 Network Error States

- **Offline:** Banner at top of content area: "You're offline. Cached photos are still here." Banner uses `--color-processing` (amber) left border. Cached grid photos remain visible and interactive (offline checkmarks queue for sync).
- **Slow connection (> 2s):** Skeleton states hold. After 4s, LQIP thumbnails promote to visible (low-res is better than empty). Full thumbnails lazy-load as bandwidth allows.
- **API error (4xx/5xx):** Toast: "Something went wrong. Try again." with retry action button.
- **Upload failure:** Per-photo error indicator in upload grid — red-tinted overlay + `undo-2` icon. "Retry" button per failed photo.

### 6.3 Empty States

Every list/grid view has a crafted empty state:
1. Lucide icon at 48px, `--color-ink-tertiary` — thematic to the context (not a generic empty-box)
2. One sentence explanation in `--text-body`, `--color-ink-secondary` — never apologetic ("no results found"), always guiding ("Upload your first photos to get started")
3. Primary or secondary CTA button — always a clear next step

---

## 7. Accessibility

### 7.1 Keyboard Navigation

- **All interactive elements** reachable via Tab. Focus order follows visual layout.
- **Photo grid:** Arrow keys navigate between photos (wrapping at row edges). Space/Enter toggles checkmark (feed) or heart (favorites). Escape closes any open menu.
- **Lightbox:** Left/Right arrows navigate photos. Escape closes. Focus trapped inside lightbox while open.
- **Tab bar:** Tab cycles between nav items. Enter selects. No arrow key navigation (tabs are spatial, not sequential).
- **Film profile selector:** Left/Right arrows cycle profiles. Enter selects. Tab moves focus out of the selector.
- **Modals/sheets:** Focus trapped. Escape closes. On close, focus returns to the trigger element.

### 7.2 Screen Reader Support

| Element | ARIA Pattern | Announcement |
|---|---|---|
| Photo in grid | `role="img"` + `alt` (EXIF date + location, or "Photo [N]") | "Photo from February 14, Golden Gate Park" |
| Checkmark button | `role="checkbox"` + `aria-checked` + `aria-label` | "Select photo for roll, unchecked" |
| Heart button | `role="checkbox"` + `aria-checked` + `aria-label` | "Mark as favorite, checked" |
| Roll progress bar | `role="progressbar"` + `aria-valuenow` + `aria-valuemax` + `aria-label` | "Roll progress, 23 of 36 photos" |
| Content mode pills | `role="tablist"`, pills as `role="tab"` + `aria-selected` | "All, selected. People. Landscapes." |
| Processing updates | `aria-live="polite"` region | "Processing photo 12 of 36" |
| Toast notifications | `role="status"` + `aria-live="polite"` | Reads message content when it appears |

### 7.3 Motion Preferences

All animations respect `prefers-reduced-motion: reduce`:
- Checkmark/heart: instant state change (no spring animation)
- Page transitions: instant swap (no slide/fade)
- Film grain: static texture (no animation)
- Skeleton pulse: solid color (no pulse)
- Lightbox open/close: instant show/hide
- Film strip shimmer at 36/36: solid color change (no gradient sweep)

These reduced-motion alternatives preserve meaning while removing movement. The user still sees checked/hearted states — they just arrive instantly.

---

## 8. Anti-Patterns

Things Claude Code must **never** do in Roll's frontend:

1. **No CSS-in-JS, styled-components, or CSS Modules.** Tailwind v4 only, using design tokens defined in `globals.css` `@theme` blocks. If a value isn't a token, it shouldn't exist.
2. **No barrel exports** (`index.ts` re-exporting components). Import directly from the component file. Barrel exports bloat bundles and obscure dependency graphs.
3. **No `useEffect` for data fetching.** Server Components handle initial data. Zustand actions handle mutations. Supabase Realtime handles subscriptions. `useEffect` is for DOM side effects only.
4. **No `any` types.** Every variable, prop, and return type must be explicit TypeScript. `unknown` is acceptable when narrowing follows.
5. **No hardcoded colors or spacing.** Every color must come from a `--color-*` token. Every spacing value from a `--space-*` token. Magic numbers are design system violations — run the token test (Section 11, design system).
6. **No `console.log` in committed code.** Use proper error boundaries and toast notifications.
7. **No default exports on non-page components.** Named exports only. Pages use default exports (Next.js requirement).
8. **No photos without aspect ratio reservation.** Every `<img>` in the grid must have explicit dimensions or CSS `aspect-ratio`. CLS is the enemy.
9. **No modals that can't be closed with Escape.** Every overlay, sheet, and lightbox must respond to Escape key and have a visible close affordance.
10. **No blue accent color anywhere.** The accent is `--color-action` (safelight terracotta). Blue would fail the swap test — it would make Roll look like every other app. If you're reaching for blue, stop and check the design system.
11. **No rounded corners on grid photos.** Contact sheet frames have sharp edges. `border-radius: 0` on all `PhotoCard` images in grid view. Rounded corners are for cards and buttons, never for the photographic content.
12. **No animation without a physical source.** Every animation must map to a physical analogy (shutter click, print emerging, page flip, door opening). If you can't name the physical source, the animation is decorative and should be removed. See `rollDESIGN_SYSTEM.md` Section 7.
