# Roll — Video Feature Design

> Extending Roll's film photography principles to video. Same mental model, same gestures, same soul.

---

## 1. Why Video, and Why Now

Roll solves the photo problem: filter noise, select favorites, develop with a film look, print. But modern camera rolls are 30–40% video. Parents shoot clips of first steps, birthday candles, playground chaos. These clips sit unwatched — too short to be a "movie," too many to review, impossible to assemble without editing skills.

**The insight:** Nobody makes home movies anymore because the tools assume you want creative control. iMovie, CapCut, Premiere — they're editors. Most parents just want their clips assembled into something beautiful without effort.

**Roll's approach to video is identical to photos:**

1. Upload your clips (just like photos)
2. We filter out the junk (just like photos)
3. Checkmark the moments you love (just like photos)
4. Choose a film stock (just like photos)
5. We assemble and grade your reel (just like developing a roll)
6. Share with your circle (just like photos)

If you know how to use Roll for photos, you already know how to use it for video. No timeline editor. No keyframes. No export settings.

**Core promise:** Your phone captures everything. Roll turns your clips into films worth watching.

**Tagline:** "Screen your reel."

---

## 2. The Four-Tier Model — Extended

The conceptual backbone extends naturally from photos to video:

| Tier | Photos | Video | How It Gets There |
|---|---|---|---|
| 1 | Raw Library | Raw Clips | Everything uploaded. The chaos. |
| 2 | Filtered Feed | Filtered Clips | Server-side filtering removes junk |
| 3 | Developed Rolls | Developed Reels | User checkmarks selections → cloud processing |
| 4 | Favorites | Favorite Reels | User hearts the best |

**Why the same model works:** AI filters noise (accidental recordings, screen captures, shaky unwatchable clips) while humans make two taste decisions: what to include (checkmark) and what to treasure (heart). Cloud processing does what neither can: professional color grading, assembly, transitions, audio normalization.

---

## 3. The Film Metaphor — Extended

Roll's identity comes from the physical world of film. The video extension draws from the same world:

| Photo World | Video World | UI Element |
|---|---|---|
| Film canister | Super 8 cartridge | Reel container |
| Contact sheet | Clip browser / storyboard | Grid of key frames |
| Grease pencil marks | Splice marks | Checkmarks on clips |
| Darkroom developing | Film lab processing | Cloud color grading |
| Film stock (Kodak, Fuji) | Film stock (same LUTs) | Profile selector |
| 36 exposures | Duration target (e.g. 3 min) | Progress bar fills with time |
| Photo prints | Screening / projection | Playback + sharing |
| Lab envelope | Film canister label | Reel card in library |

**The film strip progress bar** — Roll's signature element — extends naturally. Instead of "23 / 36" frames, it shows "1:47 / 3:00" duration. Same sprocket holes, same amber fill, same mono counter. The mechanic changes from frame count to time, but the feeling is identical: you're loading a reel.

---

## 4. Two Gestures, Same Meaning

The interaction model carries over unchanged:

- **✓ Checkmark** = "Include this clip." Adding a clip to the current reel. The workhorse gesture. Happens in the filtered clip feed (Tier 2 → 3).
- **♥ Heart** = "Treasure this reel." Marking a developed reel as a favorite. The emotional gesture. Happens after watching a developed reel (Tier 3 → 4).

**What changes:** When checkmarking a video clip, the user can optionally set in/out trim points — a simple gesture to say "just use this part." Default: include the full clip.

---

## 5. Video Filtering Pipeline

After upload, the server applies a filtering pipeline analogous to photo filtering:

### 5.1 Detection Algorithms

| # | Detection | Method | Action |
|---|---|---|---|
| 1 | Accidental recordings | Duration < 1.5s + high motion variance in first frames | Filter |
| 2 | Screen recordings | No camera EXIF + fixed UI element detection + screen dimensions | Filter |
| 3 | Extremely dark | Average luminance of sampled frames < threshold | Filter |
| 4 | Extremely shaky | Motion vector analysis across sampled frames, stabilization score < threshold | Filter |
| 5 | Near-duplicates | Perceptual hash of key frames + temporal similarity | Collapse to best quality |
| 6 | Audio-only value | Very low visual quality but meaningful audio (speech detection) | Flag, don't filter |

### 5.2 Enrichment (per clip)

Beyond filtering, each clip gets metadata enrichment:

| Enrichment | Method | Purpose |
|---|---|---|
| Key frame extraction | Scene-change detection, pick most representative frame | Thumbnail for grid display |
| Duration category | < 5s = "flash", 5–30s = "moment", 30s–3min = "scene" | UI badge + assembly hints |
| Face detection | Sample frames, same algorithm as photos | Content mode (People Only) |
| Scene classification | Color/motion analysis of sampled frames | Content mode (Landscapes) |
| Audio analysis | Speech detection, music detection, ambient classification | Assembly: preserve speech, allow music overlay on ambient |
| Stabilization score | Motion vector consistency | Used during develop: auto-stabilize shaky clips |
| Preview proxy | 720p transcode, H.264 baseline | Fast browsing without loading originals |

### 5.3 Processing Performance

- **Proxy generation:** 2–5s per clip (parallel, concurrency 3)
- **Key frame extraction:** < 1s per clip
- **Filtering analysis:** < 2s per clip (sampled frames, not every frame)
- **Total for 50 clips:** ~30–60 seconds
- **Filter rate target:** 20–30% of uploads (lower than photos — people are more intentional when recording video)

---

## 6. Clip Feed — Browsing Filtered Video

Videos appear alongside photos in the unified filtered feed, or in a dedicated "Clips" content mode pill.

### 6.1 Content Mode Pills — Extended

```
All · People · Landscapes · Clips
```

"Clips" shows video only. The other modes include both photos and video matching the filter criteria. Mode persists across sessions.

### 6.2 Video in the Grid

Videos appear as their key frame thumbnail in the contact sheet grid, distinguished by:

- **Duration badge:** Bottom-left corner, mono font (`--font-mono`), semi-transparent dark background. "0:23" format.
- **No autoplay in grid.** The grid is a contact sheet — static, scannable. Autoplay is TikTok energy. Roll is a light table.
- **Tap to preview:** Tapping a clip opens a quick preview — the clip plays muted in an expanded card with a scrubber. Not full lightbox. A quick look.
- **Long-press to play with audio:** For a richer preview without leaving the grid context.

### 6.3 Clip Lightbox

Full-screen viewer for a single clip:

- Shared element transition (scale from grid, same as photos)
- Play/pause tap
- Scrubber bar at bottom
- Muted by default, tap speaker icon for audio
- Metadata bar: date, duration, location
- Checkmark button (same position as photos)
- Swipe left/right to navigate between clips
- Swipe down or X to close

---

## 7. Reel Building — Assembling a Film

A **Reel** is the video equivalent of a Roll. Instead of 36 exposures, you're filling a duration target.

### 7.1 Reel Sizes

| Size | Duration | Clips | Metaphor | Tier |
|---|---|---|---|---|
| Short Reel | Up to 1 minute | 3–8 clips | Super 8 cartridge (50 ft) | Free |
| Standard Reel | Up to 3 minutes | 5–15 clips | Super 8 cartridge (200 ft) | Roll+ |
| Feature Reel | Up to 5 minutes | 8–25 clips | 16mm reel | Roll+ |

**Why duration targets, not exact limits:** Unlike photos where 36 is a hard cap, video is about feel. A 2:47 reel and a 3:00 reel are equally valid. The target guides the user, not restricts them. The progress bar shows how much of the target duration is filled.

### 7.2 Building Flow

1. User browses filtered clips in feed
2. Checkmarks clips to add to current reel
3. Film strip progress bar shows: "1:47 / 3:00" with sprocket holes and amber fill
4. When nearing the target, progress bar pulses gently — "almost full"
5. User can close the reel at any point (minimum: 3 clips or 15 seconds)
6. At the target duration, reel auto-closes with the same golden shimmer celebration

### 7.3 Trim on Checkmark

When a user checkmarks a clip that's longer than 15 seconds, Roll offers an optional trim step:

- Bottom sheet slides up with the clip's timeline
- Two handles: in-point and out-point
- Default: full clip selected
- Drag handles to trim
- Preview plays the trimmed segment
- "Use full clip" shortcut button
- Confirm → clip added to reel at trimmed duration

For clips under 15 seconds: no trim prompt, added directly. The user can always edit trim points later in the reel view.

### 7.4 Reel View — Pre-Development

Before developing, the user reviews and arranges their reel:

- **Storyboard layout:** Vertical list of clip thumbnails with duration bars
- **Drag to reorder:** Same as reordering photos in a roll
- **Tap clip → edit trim:** Reopen trim handles
- **Swipe to remove:** Clip returns to feed
- **Total duration** displayed prominently
- **"Develop This Reel"** CTA at bottom (same as "Develop This Roll")

---

## 8. Film Profiles — Applied to Video

The same six film profiles apply to video. LUT files work on video frames identically to how they work on photos.

| Profile | Works on Video? | Notes |
|---|---|---|
| **Warmth** (free) | Yes | Warm skin tones. Default. Beautiful for family clips. |
| **Golden** | Yes | Kodak amber. Nostalgic home movie feel. |
| **Vivid** | Yes | Bold, saturated. Great for outdoor/travel clips. |
| **Classic** (B&W) | Yes | High contrast B&W. Silent film character. |
| **Gentle** (B&W) | Yes | Soft B&W. Dreamy, intimate. |
| **Modern** (B&W) | Yes | Clean contemporary B&W. |

**Film profile preview for reels:** Instead of applying the LUT to a single photo, the preview plays a 3-second loop from the reel's first clip with the selected LUT applied as a CSS/Canvas filter (client-side approximation). The full LUT is applied server-side during development.

### 8.1 Audio Mood (New for Video)

In addition to film profile (visual), reels have an optional audio mood:

| Mood | Description | Tier |
|---|---|---|
| **Original** | Keep all original audio as-is, normalized across clips | Free |
| **Quiet Film** | Lower original audio to 30%, add gentle score underneath | Roll+ |
| **Silent Film** | Remove original audio entirely, gentle piano/strings score | Roll+ |
| **Ambient** | Keep original audio, add subtle ambient texture (room tone) | Roll+ |

**Music library:** A curated set of 10–20 royalty-free compositions per mood, matched to duration. Not AI-generated — hand-selected for warmth, restraint, and emotional resonance. Think home movie soundtracks, not TikTok beats. Licensing via Artlist or Musicbed (blanket license, per-seat).

**Why limited moods, not a music picker:** Roll makes decisions for the user. The same philosophy that limits film stocks to 6 applies to audio. The user chooses a feeling, not a track.

---

## 9. Cloud Processing Pipeline — Developing a Reel

When the user taps "Develop This Reel," the processing pipeline runs:

### 9.1 Pipeline Steps

```
User taps "Develop This Reel"
  │
  ▼
Reel status → "processing"
  │
  ▼
For each clip in reel (sequential, tracked):
  │
  ├── 1. Fetch original from R2
  ├── 2. Trim to in/out points (FFmpeg)
  ├── 3. Auto-stabilize if stabilization_score < threshold (FFmpeg vidstab)
  ├── 4. Color correction via eyeQ-derived transform
  │      ├── Extract 3 representative frames (25%, 50%, 75% through clip)
  │      ├── POST each frame to eyeQ API
  │      ├── Derive average color correction parameters
  │      └── Apply correction as FFmpeg color filter across all frames
  ├── 5. Apply film LUT (.cube via FFmpeg lut3d filter)
  ├── 6. Apply grain overlay (FFmpeg overlay filter, profile-specific)
  ├── 7. Apply subtle vignette (FFmpeg vignette filter)
  ├── 8. Normalize audio levels (FFmpeg loudnorm)
  │
  ▼
Assembly phase:
  │
  ├── 9. Concatenate clips in reel order
  ├── 10. Apply crossfade transitions (0.5s dissolve between clips)
  ├── 11. Apply audio mood (mix original + score if selected)
  ├── 12. Add 1s fade-from-black intro + 2s fade-to-black outro
  ├── 13. Encode final reel:
  │       ├── H.264 High Profile (compatibility)
  │       ├── AAC audio, 192kbps
  │       ├── Max 1080p (preserve aspect ratio)
  │       ├── Target bitrate: 8 Mbps (quality-first)
  │       └── Progressive download (faststart)
  ├── 14. Generate poster frame (key frame from first clip, with LUT)
  ├── 15. Upload assembled reel to R2
  │
  ▼
Reel status → "developed"
  │
  ▼
Send notification: "Your reel is ready to screen."
```

### 9.2 eyeQ Adaptation for Video

eyeQ processes still images, not video. Roll adapts this for video clips:

1. **Sample frames:** Extract 3 representative frames per clip (at 25%, 50%, 75% of duration)
2. **Correct frames:** POST each to eyeQ API with `roll_standard` preset
3. **Derive transform:** Average the correction parameters across sampled frames
4. **Apply to video:** Use FFmpeg color adjustment filters (curves, levels, white balance) to apply the averaged correction across all frames of the clip

**Why sample instead of every frame:** Cost ($0.02–0.05 per eyeQ call), speed, and visual consistency. A 30-second clip at 30fps is 900 frames — correcting each would cost $18–45 per clip. Sampling 3 frames costs $0.06–0.15 and produces visually consistent results because the lighting within a single clip rarely changes dramatically.

**Fallback:** Same as photos. If eyeQ fails, skip color correction and apply LUT directly to original. Mark `correction_applied: false`. User can re-develop later.

### 9.3 Processing Time Estimates

| Reel Size | Clips | Raw Duration | Processing Time | Cost (eyeQ) |
|---|---|---|---|---|
| Short (1 min) | 5 | ~2 min raw | 2–4 minutes | ~$0.30–0.75 |
| Standard (3 min) | 10 | ~5 min raw | 5–10 minutes | ~$0.60–1.50 |
| Feature (5 min) | 18 | ~10 min raw | 10–20 minutes | ~$1.08–2.70 |

**Processing UX:** Since video takes longer than photos, the UX must set expectations:

- "Developing your reel... This usually takes about [X] minutes."
- Progress: "Grading clip 3 of 10..." with a progress bar
- User can leave the page — push notification when done
- Email notification: "Your reel is ready to screen ✓"

---

## 10. Data Models

### 10.1 Extended `photos` table → `media` concept

Rather than a separate table, videos share the existing `photos` table with a `media_type` discriminator:

**New columns on `photos`:**

| Column | Type | Description |
|---|---|---|
| `media_type` | `'photo' \| 'video'` | Discriminator. Default `'photo'`. |
| `duration_ms` | `integer \| null` | Video duration in milliseconds. Null for photos. |
| `duration_category` | `'flash' \| 'moment' \| 'scene' \| null` | Null for photos. |
| `preview_storage_key` | `text \| null` | R2 key for 720p proxy video. Null for photos. |
| `audio_classification` | `'speech' \| 'music' \| 'ambient' \| 'silent' \| null` | Null for photos. |
| `stabilization_score` | `real \| null` | 0.0–1.0, higher = more stable. Null for photos. |

**Existing columns that work for both:**
- `storage_key` — original file (JPEG/HEIC for photos, MP4/MOV for video)
- `thumbnail_url` — key frame thumbnail for video
- `content_hash`, `size_bytes`, `width`, `height` — same semantics
- `filter_status`, `filter_reason` — same filtering model
- `face_count`, `scene_classification` — from sampled frames
- `date_taken`, `latitude`, `longitude` — from EXIF/metadata

### 10.2 `reels` table (parallel to `rolls`)

```sql
CREATE TABLE reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,                          -- Auto-generated from date range, editable
  status TEXT NOT NULL DEFAULT 'building',     -- 'building' | 'ready' | 'processing' | 'developed' | 'error'
  film_profile TEXT,                           -- 'warmth' | 'golden' | 'vivid' | 'classic' | 'gentle' | 'modern'
  audio_mood TEXT DEFAULT 'original',          -- 'original' | 'quiet_film' | 'silent_film' | 'ambient'
  reel_size TEXT NOT NULL DEFAULT 'short',     -- 'short' | 'standard' | 'feature'
  target_duration_ms INTEGER NOT NULL,         -- 60000 | 180000 | 300000
  current_duration_ms INTEGER NOT NULL DEFAULT 0,
  clip_count INTEGER NOT NULL DEFAULT 0,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  clips_processed INTEGER DEFAULT 0,
  correction_skipped_count INTEGER DEFAULT 0,
  assembled_storage_key TEXT,                  -- R2 key for final reel video
  poster_storage_key TEXT,                     -- R2 key for poster frame
  assembled_duration_ms INTEGER,               -- Final reel duration after assembly
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reels_user ON reels(user_id);
CREATE INDEX idx_reels_user_status ON reels(user_id, status);
```

### 10.3 `reel_clips` table (parallel to `roll_photos`)

```sql
CREATE TABLE reel_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reel_id UUID NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(id),   -- References the video in photos table
  position INTEGER NOT NULL,                        -- Order in reel (1-based)
  trim_start_ms INTEGER NOT NULL DEFAULT 0,         -- Trim in-point
  trim_end_ms INTEGER,                              -- Trim out-point (null = end of clip)
  trimmed_duration_ms INTEGER NOT NULL,             -- Computed: (trim_end - trim_start) or full duration
  processed_storage_key TEXT,                       -- R2 key for individually graded clip
  correction_applied BOOLEAN DEFAULT true,
  transition_type TEXT DEFAULT 'crossfade',         -- 'crossfade' | 'cut' | 'dip_to_black'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_reel_clip UNIQUE(reel_id, photo_id),
  CONSTRAINT uq_reel_position UNIQUE(reel_id, position)
);

CREATE INDEX idx_reel_clips_reel ON reel_clips(reel_id);
CREATE INDEX idx_reel_clips_photo ON reel_clips(photo_id);
```

### 10.4 `favorite_reels` table

```sql
CREATE TABLE favorite_reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reel_id UUID NOT NULL REFERENCES reels(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_favorite_reel UNIQUE(user_id, reel_id)
);

CREATE INDEX idx_favorite_reels_user ON favorite_reels(user_id);
```

---

## 11. Storage Architecture

### 11.1 R2 Layout — Extended

```
roll-photos-{env}/
├── originals/
│   └── {user_id}/
│       └── {content_hash}.{ext}          # .jpg/.heic (photos) AND .mp4/.mov (video)
├── thumbnails/
│   └── {user_id}/
│       └── {content_hash}_thumb.webp     # Key frame for video, thumbnail for photo
├── proxies/
│   └── {user_id}/
│       └── {content_hash}_preview.mp4    # 720p proxy for video browsing
├── processed/
│   └── {user_id}/
│       └── {roll_id}/
│           └── {position}_{profile}.jpg  # Developed photos (unchanged)
├── reels/
│   └── {user_id}/
│       └── {reel_id}/
│           ├── clips/
│           │   └── {position}_{profile}.mp4   # Individually graded clips
│           ├── assembled_{profile}.mp4         # Final assembled reel
│           └── poster.webp                     # Poster frame (with LUT)
├── circle/
│   └── {circle_id}/
│       └── {post_id}/
│           ├── {position}.jpg            # Shared photos (unchanged)
│           └── reel.mp4                  # Shared reel (copy for isolation)
└── audio/
    └── moods/
        ├── quiet_film/
        │   └── {track_id}.mp3            # Curated background scores
        ├── silent_film/
        │   └── {track_id}.mp3
        └── ambient/
            └── {track_id}.mp3
```

### 11.2 Storage Estimates

| Item | Typical Size | Notes |
|---|---|---|
| Original video clip (30s, 1080p) | 50–100 MB | iPhone default bitrate |
| 720p proxy | 5–10 MB | For browsing, heavily compressed |
| Key frame thumbnail | 20–50 KB | WebP, 400px wide |
| Graded clip (30s) | 30–60 MB | H.264, 8 Mbps target |
| Assembled reel (3 min) | 150–300 MB | H.264, 8 Mbps target |

### 11.3 Storage Tiers

| Tier | Free | Roll+ |
|---|---|---|
| Video upload | 50 clips | Unlimited |
| Proxy generation | All uploads | All uploads |
| Original retention | 30 days | Unlimited |
| Developed reels | 1 reel | Unlimited |

---

## 12. API Routes

### 12.1 Upload

Existing upload routes extend to handle video:

```
POST /api/upload/presign
  → Accept video MIME types: video/mp4, video/quicktime, video/x-m4v
  → Return presigned R2 URL for original

POST /api/upload/complete
  → Detect media_type from content_type
  → For video: queue proxy generation + key frame extraction + filtering
  → Create photo record with media_type = 'video'
```

### 12.2 Video Processing

```
POST /api/process/video-prepare
  → Generate 720p proxy
  → Extract key frame thumbnail
  → Extract audio waveform data
  → Run video filtering pipeline
  → Update photo record with video-specific metadata

POST /api/process/develop-reel
  → Validate reel (status = 'ready', all clips accessible)
  → For each clip: trim, stabilize, eyeQ-correct, apply LUT + grain + vignette
  → Assemble clips with transitions
  → Apply audio mood
  → Encode final reel
  → Upload to R2
  → Update reel status → 'developed'
  → Send notification
```

### 12.3 Reel Management

```
POST   /api/reels                    → Create new reel
GET    /api/reels                    → List user's reels
GET    /api/reels/[id]               → Get reel detail
PATCH  /api/reels/[id]               → Update reel (name, film_profile, audio_mood)
DELETE /api/reels/[id]               → Delete reel (if not developed)

POST   /api/reels/[id]/clips         → Add clip to reel (with optional trim)
PATCH  /api/reels/[id]/clips/[clipId] → Update clip (trim, position)
DELETE /api/reels/[id]/clips/[clipId] → Remove clip from reel

POST   /api/reels/[id]/develop       → Trigger development
POST   /api/reels/[id]/favorite      → Heart/unheart the reel
```

### 12.4 Circle Sharing — Extended

```
POST /api/circles/[id]/posts
  → Existing: share photos
  → Extended: optionally include a reel_id
  → If reel_id present:
    → Copy assembled reel to circle namespace
    → Create circle_post with type = 'reel'
    → Reel plays inline in circle feed
```

---

## 13. Frontend Architecture

### 13.1 New Stores

**reelStore (Zustand):**
```typescript
interface ReelStore {
  currentReel: Reel | null;
  clipIds: string[];           // Ordered clip IDs in current reel
  trimPoints: Map<string, { startMs: number; endMs: number | null }>;
  filmProfile: FilmProfile;
  audioMood: AudioMood;

  // Actions
  addClip: (photoId: string, trimStart?: number, trimEnd?: number) => void;
  removeClip: (photoId: string) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  setTrim: (photoId: string, startMs: number, endMs: number | null) => void;
  setFilmProfile: (profile: FilmProfile) => void;
  setAudioMood: (mood: AudioMood) => void;
  closeReel: () => void;
  resetReel: () => void;
}
```

### 13.2 New Components

**ClipDurationBadge** — Duration overlay on video thumbnails in grid
```
Position: bottom-left, 6px inset
Background: oklch(0 0 0 / 0.6)
Text: --font-mono, --text-caption, white
Format: "0:23" (m:ss)
Border-radius: 2px
Padding: 2px 4px
```

**ClipPreview** — Quick preview on tap in grid
```
Expanded card (not full lightbox)
Plays clip muted
Simple scrubber bar at bottom
Checkmark button (top-right, same as photos)
Tap outside to dismiss
Speaker icon toggle for audio
```

**ReelStripProgress** — Film strip progress bar for reels
```
Identical to FilmStripProgress but:
  Left: Reel name ("Reel 1")
  Center: Amber fill based on duration ratio
  Right: "1:47 / 3:00" (mono font, duration instead of frame count)
  Sprocket holes: identical decoration
  Completion: same golden shimmer at target duration
```

**TrimControls** — In/out point selector
```
Bottom sheet on checkmark (clips > 15s)
Full-width video timeline
Two drag handles (in/out) with frame preview
Time readout: "0:05 — 0:18" in mono
"Use full clip" shortcut button
Preview playback of trimmed segment
```

**ReelStoryboard** — Pre-development reel view
```
Vertical list of clip cards
Each card: key frame thumbnail (120×68px) + clip name/date + duration bar + trim range
Drag handle (left) for reorder
Swipe right to remove
Total duration display at top
Film profile selector at bottom
Audio mood selector below film profile
"Develop This Reel" CTA
```

**AudioMoodSelector** — Audio treatment chooser
```
Horizontal row of 4 options
Each: icon + label
  Original: waveform icon, "Original"
  Quiet Film: volume-1 icon, "Quiet Film"
  Silent Film: volume-x icon, "Silent Film"
  Ambient: wind icon, "Ambient"
Active: inverted, same as content mode pills
Locked (free tier): same 40% opacity overlay
```

**ReelPlayer** — Developed reel playback
```
Full-screen video player
Shared element transition from reel card
Play/pause on tap
Scrubber with clip boundary markers
Heart button (bottom-right)
Share to Circle button
Film profile badge (top-left)
Swipe down to close
```

### 13.3 Page Architecture — Extended

```
/(app)/
  ├── feed                    → Unified feed (photos + videos)
  ├── library
  │   ├── [id]                → Roll detail (photos) — unchanged
  │   ├── develop             → Film stock selection for rolls — unchanged
  │   ├── reels/[id]          → Reel detail (storyboard, pre-develop)
  │   └── reels/[id]/screen   → Reel playback (post-develop)
  └── ...existing routes
```

---

## 14. Design System Extensions

### 14.1 New Design Tokens

```css
@theme {
  /* Reel-specific tokens */
  --color-reel-badge: oklch(0 0 0 / 0.6);        /* Duration badge background */
  --color-timeline: var(--color-filmstrip);         /* Reuses film strip color */
  --color-trim-handle: var(--color-safelight);      /* In/out handles = safelight amber */
  --color-trim-region: oklch(0.62 0.15 45 / 0.2);  /* Selected region, translucent safelight */
  --color-clip-boundary: oklch(1 0 0 / 0.3);       /* Clip boundary markers in scrubber */
}
```

### 14.2 Motion — Video-Specific

| Animation | Duration | Easing | Physical Source |
|---|---|---|---|
| Clip preview expand | 250ms | cubic-bezier(0.16, 1, 0.3, 1) | Pulling a film frame off the contact sheet for a closer look |
| Trim handle drag | real-time | none (direct manipulation) | Threading film through a splicer |
| Clip reorder | 200ms | spring(400, 17) | Rearranging film strips on the editing bench |
| Reel develop progress | continuous | linear | Footage running through the developing bath |
| Crossfade preview | 500ms | ease-in-out | Dissolve between scenes, the classic film transition |

### 14.3 Iconography — New Icons

| Icon | Usage | Lucide Name | Context |
|---|---|---|---|
| Play | Video indicator, playback | `play` | Clip preview, reel player |
| Film | Reel indicator | `film` | Reel cards (reused from roll) |
| Scissors | Trim | `scissors` | Trim controls |
| Volume 2 | Audio on | `volume-2` | Clip/reel audio toggle |
| Volume X | Audio off/muted | `volume-x` | Muted state, Silent Film mood |
| Clapperboard | Reel tab / section | `clapperboard` | Library section header |
| Waveform | Audio mood indicator | `audio-waveform` | Audio mood selector |

---

## 15. Circle Sharing — Video

Developed reels can be shared to Circles alongside photos:

### 15.1 Sharing Flow

1. User develops a reel
2. From reel player or library, taps "Share to Circle"
3. Bottom sheet: select circle, optional caption
4. Reel is copied to circle namespace in R2
5. Circle post created with `type = 'reel'`
6. Broadcast to circle members via Realtime

### 15.2 Reel in Circle Feed

```
CirclePostCard (type = 'reel'):
  Author header: avatar + name + timestamp
  Video player: poster frame → tap to play
  Duration badge on poster
  Film profile badge (e.g., "Warmth")
  Caption
  Reaction buttons (heart/smile/wow with counts)
  Comment toggle + threaded comments
```

**Reel playback in circle:** Inline player, muted by default, tap for audio. Not autoplay — the user decides when to watch. Respects Roll's calm, intentional ethos.

### 15.3 New Column on `circle_posts`

```sql
ALTER TABLE circle_posts ADD COLUMN post_type TEXT NOT NULL DEFAULT 'photos';
-- 'photos' | 'reel'
ALTER TABLE circle_posts ADD COLUMN reel_storage_key TEXT;
-- R2 key for shared reel video (null for photo posts)
ALTER TABLE circle_posts ADD COLUMN reel_poster_key TEXT;
-- R2 key for reel poster frame (null for photo posts)
ALTER TABLE circle_posts ADD COLUMN reel_duration_ms INTEGER;
-- Duration for display (null for photo posts)
```

---

## 16. Processing Architecture — Technical Detail

### 16.1 FFmpeg as Core Video Engine

All video processing uses FFmpeg. Two deployment options:

**Option A: Vercel Serverless (Prototype)**
- FFmpeg binary bundled in serverless function (via `@ffmpeg/ffmpeg` or static binary)
- 300s max execution time (Vercel Pro, configured in vercel.json)
- Good for short reels (1 min), may timeout on feature reels
- Use for prototype validation

**Option B: Supabase Edge Function + Dedicated Worker (Production)**
- Edge Function triggers a processing job
- Dedicated compute instance (Fly.io, Railway, or Hetzner) runs FFmpeg
- No execution time limit
- Status updates via Supabase Realtime
- Preferred for launch

### 16.2 FFmpeg Filter Chains

**Per-clip processing:**
```bash
ffmpeg -i input.mp4 \
  -ss {trim_start} -to {trim_end} \                    # Trim
  -vf "vidstabtransform=smoothing=10,                    # Stabilize
       curves=master='0/0 0.25/{shadow} 0.5/{mid} 0.75/{highlight} 1/1', # eyeQ-derived correction
       lut3d='{profile}.cube',                           # Film LUT
       overlay='{grain_texture}':format=auto,            # Grain overlay
       vignette=PI/{vignette_angle}" \                   # Vignette
  -af loudnorm=I=-16:TP=-1.5:LRA=11 \                  # Audio normalization
  -c:v libx264 -preset slow -crf 18 \                   # High quality H.264
  -c:a aac -b:a 192k \                                  # AAC audio
  -movflags +faststart \                                 # Progressive download
  output.mp4
```

**Assembly:**
```bash
# Concatenate with crossfade transitions
ffmpeg \
  -i clip1.mp4 -i clip2.mp4 -i clip3.mp4 \
  -filter_complex "
    [0:v][1:v]xfade=transition=fade:duration=0.5:offset={clip1_dur-0.5}[v01];
    [v01][2:v]xfade=transition=fade:duration=0.5:offset={clip1+clip2_dur-1.0}[vout];
    [0:a][1:a]acrossfade=d=0.5[a01];
    [a01][2:a]acrossfade=d=0.5[aout]
  " \
  -map "[vout]" -map "[aout]" \
  -c:v libx264 -preset slow -crf 18 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  assembled.mp4
```

### 16.3 Video Stabilization

Two-pass stabilization for shaky clips:

```bash
# Pass 1: Analyze motion
ffmpeg -i input.mp4 -vf vidstabdetect=shakiness=5:accuracy=15 -f null -

# Pass 2: Apply stabilization
ffmpeg -i input.mp4 -vf vidstabtransform=smoothing=10:crop=black:zoom=1 output.mp4
```

Only applied when `stabilization_score < 0.6`. Light stabilization (smoothing=10) — enough to remove hand shake, not so much that it feels artificial.

---

## 17. Subscription Model — Extended

| Feature | Free | Roll+ |
|---|---|---|
| Video upload | 50 clips | Unlimited |
| Video filtering | All uploads | All uploads |
| Reel building | Short reels only (1 min) | All sizes (1/3/5 min) |
| Film profiles (video) | Warmth only | All 6 |
| Audio moods | Original only | All 4 |
| Developed reels | 1 reel | Unlimited |
| Share reels to Circle | ✗ | Yes |
| Video cloud backup | 10 clips | Unlimited |
| **Everything photo** | **Unchanged** | **Unchanged** |

---

## 18. Success Metrics

| Metric | Target |
|---|---|
| Video filter precision | > 85% |
| Time to first clip checkmark | < 3 min from filtered feed |
| Reel completion rate | > 50% of users who add 1+ clip finish a reel |
| Reel develop rate | > 70% of completed reels are developed |
| Reel favorite rate | > 25% of developed reels are hearted |
| Circle reel share rate | > 30% of developed reels are shared (among Roll+ users) |
| Processing time (short reel) | < 5 minutes |
| "Would you use this?" | > 40% of prototype testers say yes |

---

## 19. Migration Path

### Phase 1: Foundation (prototype)
- Extend `photos` table with video columns
- Video upload + proxy generation + key frame extraction
- Video filtering pipeline
- Videos in feed grid with duration badges
- Clip lightbox with playback

### Phase 2: Reel Building (prototype)
- `reels` and `reel_clips` tables
- Reel building UI (checkmark clips, trim, storyboard)
- ReelStripProgress component
- Film profile selection for reels

### Phase 3: Development Pipeline (prototype)
- FFmpeg integration (Vercel serverless)
- Per-clip processing (trim, stabilize, LUT, grain, vignette)
- eyeQ frame sampling for video color correction
- Reel assembly with crossfade transitions
- Audio normalization

### Phase 4: Polish
- Audio moods (music library integration)
- Circle sharing for reels
- Reel player with clip boundary markers
- Favorite reels

### Phase 5: Scale (post-prototype)
- Dedicated video processing worker (Fly.io/Railway)
- Adaptive bitrate streaming (HLS) for large reels
- Video CDN (Cloudflare Stream or Mux)
- Longer reel durations
- AI-suggested clip ordering

---

## 20. Out of Scope

- Live video capture in-app
- Collaborative reel editing (multiple users building one reel)
- Text overlays, stickers, or graphical effects on video
- Speed ramping (slow motion / fast forward)
- Green screen or background replacement
- AI-generated narration or voiceover
- Direct posting to Instagram/TikTok/YouTube
- Video-to-GIF conversion
- Frame-by-frame scrubbing during trim (use keyframe preview instead)
- Custom transition effects (crossfade only — deliberate constraint like 6 film stocks)
- User-uploaded music (curated library only — Roll makes decisions)
