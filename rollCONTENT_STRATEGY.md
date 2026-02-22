# Roll — Content Strategy

> Copy, sample content, content structure, and brand voice guidelines for the web prototype.

---

## 1. Brand Voice

Roll speaks like a warm, experienced photo lab owner who genuinely cares about preserving memories — not a tech company optimizing engagement metrics.

### 1.1 Voice Attributes

| Attribute | Roll Sounds Like | Roll Does NOT Sound Like |
|---|---|---|
| **Warm** | "Your roll is developed." | "Processing complete!" |
| **Confident** | "We'll clean up the noise." | "Our AI-powered algorithm will attempt to filter..." |
| **Poetic (sparingly)** | "The photos worth keeping." | "Curated content optimized for your feed." |
| **Honest** | "We removed 47 duplicates and blurry shots." | "We enhanced your library experience." |
| **Simple** | "Pick your favorites." | "Select assets for development pipeline processing." |

### 1.2 Writing Rules

1. **Use "your" not "my."** "Your photos," "your roll," "your favorites." Never "my photos" in UI copy.
2. **Use photography language, not tech language.** "Develop" not "process." "Film stock" not "filter preset." "Roll" not "batch." "Print" not "output."
3. **Short sentences.** 10 words or fewer for UI labels and CTAs. Save longer prose for onboarding and email.
4. **No exclamation marks in the UI.** Calm confidence. The work speaks for itself.
5. **Numbers are specific.** "We removed 47 screenshots" not "We removed some screenshots."
6. **Active voice always.** "Roll cleaned up your library" not "Your library was cleaned up by Roll."

### 1.3 Forbidden Words

Never use in the Roll UI or marketing:
- "AI-powered" or "AI" (the user doesn't care how it works)
- "Algorithm" or "algorithmic"
- "Content" (say "photos" or "images")
- "Engagement" or "metrics"
- "Feed" (internally yes, but UI says "Your Photos")
- "Upload" as a noun (use "photos" — "Upload your photos" is fine as a verb)
- "Filter" to describe film profiles (say "film stock" or "profile")
- Any Kodak or Fuji film stock name (Portra, Tri-X, etc.)

---

## 2. UI Copy (Every Screen)

### 2.1 Auth / Login

| Element | Copy |
|---|---|
| Logotype | ROLL |
| Tagline | Develop your roll. |
| Email field placeholder | your@email.com |
| CTA button | Send Magic Link |
| Success message | Check your email for a sign-in link. |
| Error: invalid email | Enter a valid email address. |
| Error: general | Something went wrong. Try again. |
| Password option | Sign in with password |
| New user note | New here? We'll create your account automatically. |

### 2.2 Onboarding

| Step | Headline | Body |
|---|---|---|
| Upload | Upload your photos | Drag and drop up to 500 photos. We'll clean up the noise. |
| Processing | Cleaning up your library… | Removing screenshots, duplicates, and blurry shots. |
| Result | Here's what's worth keeping. | We removed [N] screenshots, duplicates, and blurry shots. [M] photos made the cut. |
| Tutorial | Two gestures, that's it. | ✓ Checkmark photos to fill your roll. ♥ Heart your favorites after developing. |
| Tutorial CTA | Start picking |  |

### 2.3 Feed (Your Photos)

| Element | Copy |
|---|---|
| Page title | Your Photos |
| Content mode: All | All |
| Content mode: People | People |
| Content mode: Landscapes | Landscapes |
| Upload button | Upload |
| Empty: no photos | Upload your first photos to get started. |
| Empty: no photos in mode | No [people/landscape] photos found. Try a different mode. |
| Hide context menu | Hide |
| Hide toast | Photo hidden. [Undo] |
| Roll progress label | Roll 1 |

### 2.4 Roll Building

| Element | Copy |
|---|---|
| Roll counter | 23 / 36 |
| Roll auto-close celebration | Your roll is full. Ready to develop. |
| Develop early CTA | Develop now |
| Develop early note | Minimum 10 photos to develop. |
| Roll name (auto-generated) | February 12–18 |
| Roll name placeholder | Name this roll |

### 2.5 Film Selection

| Element | Copy |
|---|---|
| Page title | Choose your film |
| Film profile: Warmth | Warmth |
| Film profile: Golden | Golden |
| Film profile: Vivid | Vivid |
| Film profile: Classic | Classic |
| Film profile: Gentle | Gentle |
| Film profile: Modern | Modern |
| CTA | Develop this roll |
| Time estimate | About 2 minutes for [N] photos. |
| Locked profile | Roll+ members get all 6 film stocks. |

### 2.6 Processing

| Element | Copy |
|---|---|
| Status: processing | Developing your roll… |
| Progress | Photo [X] of [N] |
| Completion | Your roll is developed. |
| Completion CTA | See your photos |
| Error | Something went wrong developing your roll. [Try again] |

### 2.7 Library

| Element | Copy |
|---|---|
| Tab: Rolls | Rolls |
| Tab: Favorites | Favorites |
| Roll status: Building | Building |
| Roll status: Ready | Ready to develop |
| Roll status: Processing | Developing… |
| Roll status: Developed | Developed |
| Roll status: Printed | Printed |
| Roll card footer | [N] photos · [Profile] · Developed [Date] |
| Empty rolls | Your developed rolls will appear here. |
| Empty favorites | Heart your favorite photos after developing a roll. They'll collect here. |

### 2.8 Print Ordering

| Element | Copy |
|---|---|
| CTA | Order prints |
| Free first roll banner | Your first roll of prints is free. No catch. |
| Free first roll CTA | Get your free prints |
| Product: Roll prints | Roll Prints — [N] photos, 4×6 glossy |
| Product: Album prints | Album Prints — Your favorites, premium packaging |
| Address form title | Where should we send them? |
| Confirm CTA | Order [N] prints |
| Confirmation title | Your prints are on the way. |
| Confirmation body | [N] prints shipping to [City]. Expect delivery in 3–5 business days. |
| Status: pending | Order placed |
| Status: in production | Printing |
| Status: shipped | Shipped — [Track] |
| Status: delivered | Delivered |

### 2.9 Circle

| Element | Copy |
|---|---|
| Page title | Circle |
| Create CTA | Create a Circle |
| Create placeholder | Family Photos, Mom Group, etc. |
| Invite CTA | Invite |
| Invite copied | Invite link copied. Valid for 7 days. |
| Share CTA | Share to Circle |
| Empty: no circles | Create a Circle to share your best photos with family and friends. |
| Empty: no posts | No photos shared yet. Develop a roll and share your favorites. |
| Free tier note | Join circles and react to photos. Create circles with Roll+. |

### 2.10 Account

| Element | Copy |
|---|---|
| Page title | Account |
| Tier: Free | Free |
| Tier: Plus | Roll+ |
| Tier toggle (prototype) | Simulate Roll+ |
| Print history | Print History |
| Filtered photos | Filtered Photos |
| Filtered photos note | Photos we removed automatically, plus photos you hid. |
| Recover button | Recover |
| Sign out | Sign out |
| Sign out confirm | Sign out of Roll? |
| Storage | Storage: [N] of [Max] photos backed up |

---

## 3. Email Copy

See API_INTEGRATIONS.md Section 4.3 for template structure. Key copy:

**Magic link email:**
- Subject: "Sign in to Roll"
- Body: "Click the button below to sign in. This link expires in 1 hour."
- CTA: "Sign In"

**Roll developed:**
- Subject: "Your roll is developed ✓"
- Body: "Your [Roll Name] is ready. [N] photos, [Profile] film stock."
- CTA: "View Your Roll"

**Prints shipped:**
- Subject: "Your prints are on the way"
- Body: "[N] prints shipping to [City]. Estimated delivery: 3–5 business days."
- CTA: "Track Your Order"

---

## 4. Sample Data for Prototype

### 4.1 Seed Photos

The prototype needs realistic test data. Prepare 50+ royalty-free photos with varied content:

| Category | Count | Source | Purpose |
|---|---|---|---|
| Family/people photos | 20 | Unsplash (family category) | Test People Only mode, face detection |
| Landscapes/nature | 10 | Unsplash (nature category) | Test Landscapes mode |
| Indoor/general | 10 | Unsplash (lifestyle category) | General feed content |
| Screenshots (to be filtered) | 5 | Create manually | Test screenshot detection |
| Blurry photos (to be filtered) | 3 | Manually blur clean photos | Test blur detection |
| Near-duplicates | 4 (2 pairs) | Slight crops of same photo | Test duplicate detection |

### 4.2 Seed EXIF Data

Generate realistic EXIF data for seed photos:
- Date range: past 6 months
- GPS: mix of locations (home area, vacation spot, local park)
- Camera: "iPhone 15 Pro" for most, some "iPhone 13"
- Orientation: mix of portrait and landscape

### 4.3 Film Profile LUT Files

Six `.cube` (3D LUT) files need to be created or sourced. Each must be:
- Format: 33×33×33 3D LUT in `.cube` format
- Tested on diverse photo types (portrait, landscape, indoor, outdoor, skin tones)
- Emotionally distinct from the others

**LUT creation approach:**
1. Start with open-source film emulation LUTs (e.g., from RawTherapee or darktable community)
2. Customize in DaVinci Resolve or similar color grading software
3. Export as `.cube` files
4. Test on 20+ diverse photos to validate quality
5. Iterate until each profile produces results that feel like real film

---

## 5. Content That Needs Creation Pre-Launch

| Content | Format | Owner | Status |
|---|---|---|---|
| 6 film profile LUT files | .cube | Joshua / Colorist | To create |
| 6 grain texture overlays | .webp (tileable) | Joshua / Designer | To create |
| Film grain background texture | .webp (tileable, subtle) | Designer | To create |
| ROLL logotype (SVG) | .svg | Joshua / Designer | To create |
| App icon (favicon + touch icon) | .png (multiple sizes) | Designer | To create |
| Landing page hero image | Photo or illustration | Joshua | To create |
| 50+ seed photos with EXIF | .jpg | Curated from Unsplash | To curate |
| Email templates (4) | HTML + Resend | Developer | Built during Phase 1 |

---

## 6. Content Anti-Patterns

1. **Never say "upload your content."** Say "upload your photos."
2. **Never describe the app as a "platform."** It's an app, a tool, a photo lab.
3. **Never use marketing buzzwords** like "leverage," "synergy," "ecosystem," "seamless."
4. **Never promise AI accuracy.** Say "we'll clean up the noise" not "our AI perfectly identifies..."
5. **Never show an empty state without a clear next action.** Every empty state has a CTA.
6. **Never use placeholder text in the prototype.** Every string should be final copy, even for testing.
