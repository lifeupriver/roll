# Roll Documentation Audit Report

> Generated 2026-02-22. Pre-build audit of all 14 documentation files to catch contradictions before Claude Code builds the wrong thing.

---

## Overall Score: 62/100

The authoritative specification docs (DATA_MODEL, BACKEND, FRONTEND, DESIGN_SYSTEM) are solid and internally consistent. The problem is concentrated in **two files**: `rollCLAUDE_CODE_PROMPT.md` (~15 blockers) and `CLAUDE for Roll.md` (3 blockers). These are the files Claude Code reads first, so contradictions here would cascade into every build decision.

---

## 🔴 BLOCKER Findings (Would cause Claude Code to build the wrong thing)

### B1. Content modes "All / Own / Drafts" — should be "All / People / Landscapes"
- **File:** rollCLAUDE_CODE_PROMPT.md — Tasks 4, 6, 8, 27, Verification checklist
- **Lines:** 51, 112, 130, 308, 395
- **Authoritative source:** rollFRONTEND.md, rollPRD.md — consistently use "All / People / Landscapes"
- **Impact:** Claude Code would build the wrong filter UI and wrong query logic

### B2. All 14 table names wrong in Task 19
- **File:** rollCLAUDE_CODE_PROMPT.md line 240
- **Wrong:** users, photos, photo_metadata, rolls, roll_photos, films, roll_films, likes/favorites, circles, circle_members, prints, events, audit_log, feature_flags
- **Correct (per rollDATA_MODEL.md):** profiles, photos, rolls, roll_photos, favorites, circles, circle_members, circle_invites, circle_posts, circle_post_photos, circle_reactions, print_orders, print_order_items, processing_jobs
- **Impact:** Claude Code would create a completely wrong database schema

### B3. Photo schema uses boolean flags — should use filter_status enum
- **File:** rollCLAUDE_CODE_PROMPT.md — Tasks 8, 27
- **Lines:** 129, 311-313
- **Wrong:** `is_screenshot, is_duplicate, is_blurry, is_dark, is_hidden` (individual booleans)
- **Correct (per rollDATA_MODEL.md lines 111-114):** `filter_status` enum ('pending', 'visible', 'filtered_auto', 'hidden_manual') + `filter_reason` ('blur', 'screenshot', 'duplicate', 'exposure', 'document')
- **Impact:** Wrong column types, wrong query patterns, wrong filtering logic

### B4. Nonexistent `photo_metadata` table referenced 4 times
- **File:** rollCLAUDE_CODE_PROMPT.md — Tasks 19, 20, 21, 26
- **Lines:** 240, 250, 259-264, 301
- **Reality:** No such table exists. Metadata fields are ON the `photos` table itself.
- **Impact:** Claude Code would try to create and query a table that shouldn't exist

### B5. Auth routes wrong
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 11
- **Lines:** 152-158
- **Wrong:** `/auth/magic-link/page.tsx` and `/auth/magic-link/callback/page.tsx`
- **Correct (per CLAUDE for Roll.md, rollFRONTEND.md):** `/(auth)/login/page.tsx` and `/(auth)/callback/page.tsx`
- **Impact:** Wrong route structure, broken navigation

### B6. Upload architecture completely different
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 16
- **Lines:** 205-212
- **Wrong:** Single `POST /api/photos/upload` endpoint accepting FormData
- **Correct (per rollBACKEND.md):** Two-step presigned URL flow: `POST /api/upload/presign` → client uploads to R2 → `POST /api/upload/complete`
- **Impact:** Fundamentally different upload architecture — would need complete rebuild

### B7. Thumbnail size wrong
- **File:** rollCLAUDE_CODE_PROMPT.md — Tasks 15, 16
- **Lines:** 198, 210
- **Wrong:** 240×240px
- **Correct (per rollBACKEND.md line 101, rollDATA_MODEL.md line 92):** 400px wide WebP
- **Impact:** Wrong thumbnail dimensions, quality, and format

### B8. Directory structure mismatches
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 2
- **Line:** 72
- **Wrong:** `src/store` (singular), `src/services` directory
- **Correct (per CLAUDE for Roll.md line 141, 211):** `src/stores/` (plural), no `src/services` directory
- **Impact:** Wrong directory tree, imports would break

### B9. Store names don't match
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 6
- **Lines:** 111-115
- **Wrong:** `authStore`, `uiStore` in `src/store/`
- **Correct (per CLAUDE for Roll.md lines 142-145):** `userStore`, `filterStore` in `src/stores/`
- **Impact:** Wrong state architecture and import paths

### B10. Settings page path wrong
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 33
- **Line:** 377
- **Wrong:** `/app/settings/page.tsx`
- **Correct (per CLAUDE for Roll.md line 74, rollFRONTEND.md line 20):** `/(app)/account/page.tsx`
- **Impact:** Wrong route, tab bar label mismatch

### B11. Filter pipeline missing document detection + wrong thresholds
- **File:** rollCLAUDE_CODE_PROMPT.md — Tasks 22-26
- **Wrong:** Only 4 filters (blur, screenshot, duplicate, dark). "Dark" detection. Duplicate threshold "score > 0.90."
- **Correct (per rollBACKEND.md):** 5 filters + face detection + scene classification. "Exposure" detection (both over AND under). Duplicate threshold pHash hamming distance < 5.
- **Impact:** Missing entire filter category, wrong threshold logic

### B12. "Users Table" reference — should be "profiles"
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 7
- **Line:** 125
- **Wrong:** "rollDATA_MODEL.md 'Users Table'"
- **Correct:** `profiles` table
- **Impact:** Claude Code would look for a nonexistent section/table

### B13. Feed API route doesn't exist
- **File:** rollCLAUDE_CODE_PROMPT.md — Task 27
- **Line:** 307
- **Wrong:** `GET /api/photos/feed`
- **Reality:** Not in rollBACKEND.md route map. Feed is client-side query on Supabase `photos` table with filter_status = 'visible'
- **Impact:** Unnecessary API route that duplicates Supabase query

### B14. tailwind.config.ts in project structure tree
- **File:** CLAUDE for Roll.md — line 175
- **Wrong:** `tailwind.config.ts` listed in project structure
- **Correct:** Tailwind v4 uses `@theme` in globals.css — no config file
- **Contradiction:** rollDESIGN_SYSTEM.md explicitly says "No tailwind.config.ts"; rollCLAUDE_CODE_PROMPT.md Task 3 correctly says "there is NO tailwind.config.ts"
- **Impact:** Claude Code would see conflicting instructions about Tailwind configuration

### B15. "Use design tokens from tailwind.config.ts" in styling rules
- **File:** CLAUDE for Roll.md — line 217
- **Wrong:** "Use design tokens from `tailwind.config.ts`"
- **Correct:** "Use design tokens from `globals.css`"
- **Impact:** Points to nonexistent file for token source

---

## 🟡 IMPORTANT Findings

### I1. Vercel function timeout contradiction
- **File:** rollARCHITECTURE.md line 173
- **Says:** "Limited to 60s execution time on Vercel Pro"
- **rollDEPLOYMENT.md vercel.json:** 300s maxDuration for `/api/process/**`
- **Fix:** Clarify that default is 60s but process routes are configured for 300s

### I2. R2 public URL placeholder
- **File:** rollARCHITECTURE.md line 396
- **Says:** `R2_PUBLIC_URL=https://photos.yourdomain.com`
- **rollDEPLOYMENT.md:** `R2_PUBLIC_URL=https://photos.roll.photos`
- **Fix:** Use consistent production URL

### I3. Doc filenames in CLAUDE for Roll.md don't match actual files
- **File:** CLAUDE for Roll.md lines 186-197
- **Wrong:** `docs/PRD.md`, `docs/ARCHITECTURE.md`, etc.
- **Actual files:** `rollprd.md`, `rollARCHITECTURE.md`, etc. (no `docs/` directory, "roll" prefix)
- **Fix:** Update to match actual filenames

---

## Remediation Plan

**Priority 1:** Fix rollCLAUDE_CODE_PROMPT.md (15 blockers)
**Priority 2:** Fix CLAUDE for Roll.md (3 blockers + 1 important)
**Priority 3:** Fix rollARCHITECTURE.md (2 important)

Proceeding to fix all issues now.
