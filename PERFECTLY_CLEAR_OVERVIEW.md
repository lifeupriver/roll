# Roll — App Overview for Perfectly Clear / eyeQ Imaging

---

## What Is Roll?

Roll is a native iOS app that solves a simple problem: people take thousands of photos and videos on their phones, but never do anything with them. No one prints. No one organizes. The camera roll becomes a graveyard of screenshots, duplicates, and forgotten moments.

Roll fixes this. Users upload their photo and video libraries, and Roll automatically filters out the noise — screenshots, duplicates, blurry shots, accidental recordings. What's left is a clean feed of photos and videos worth keeping.

From there, users select their best 36 photos to fill a "roll" (modeled after a 36-exposure film roll) or their best video clips to build a "reel." They choose a film stock — a creative look inspired by classic film photography — and Roll develops their selections with professional cloud processing. The result: photos and videos that look like they were shot on film and finished by a great lab.

Users can then order real photographic prints delivered to their door, share with private groups, and build a portfolio of their best work over time.

**The core promise:** Your phone captures everything. Roll turns it into something worth keeping.

---

## How Roll Works

Roll follows a four-tier model:

1. **Raw Library** — Everything the user uploads. The unorganized chaos of a modern camera roll.
2. **Filtered Feed** — Server-side intelligence removes junk (screenshots, duplicates, blurry photos, accidental recordings, extremely dark/bright images). Typically filters out 30–50% of uploads. Users see only what's worth reviewing.
3. **Developed Rolls / Reels** — Users select their favorites. For photos, they checkmark 36 shots to fill a roll. For video, they checkmark clips to fill a reel (up to 3 minutes). They choose a film stock, and Roll processes their selections in the cloud.
4. **Favorites** — Users heart their absolute best from developed rolls and reels, building a portfolio over time.

The key insight: AI is good at identifying technical junk (blur, duplicates, screenshots) but bad at identifying beauty or emotional significance. Roll uses automated processing for what it's good at — filtering and color correction — and leaves the creative decisions to humans.

---

## Where Perfectly Clear Fits

Perfectly Clear is the engine behind Roll's cloud color correction. It sits at the center of the processing pipeline — the step that transforms ordinary phone snapshots into photos that look professionally finished.

### Photo Processing Pipeline

For each photo in a completed roll, the pipeline is:

1. **Perfectly Clear correction** — Scene detection, white balance, exposure normalization, skin tone accuracy, adaptive sharpening, noise reduction
2. **Film profile (LUT) application** — A .cube LUT that applies the creative look of the selected film stock
3. **Grain and finishing** — Film grain overlay and subtle vignette to complete the analog aesthetic

Perfectly Clear handles step 1 — the technical correction that gets the photo to a neutral, well-exposed, accurate starting point. The LUT in step 2 then applies the creative grade on top of that corrected image. This two-step approach is essential: applying a creative LUT to an uncorrected phone photo produces inconsistent results, but applying it to a Perfectly Clear-corrected image produces consistent, beautiful results every time.

### Video Processing Pipeline

Roll extends the same model to video. Since Perfectly Clear processes still images, Roll adapts the workflow:

1. **Sample representative frames** from each video clip (3 frames per clip, at the 25%, 50%, and 75% marks)
2. **Send each sampled frame through Perfectly Clear** for correction
3. **Derive averaged correction parameters** from the corrected frames
4. **Apply the correction across all frames** of the clip using video processing filters
5. **Apply the film LUT** (.cube file via video filter chain) for creative grading
6. **Apply grain overlay and vignette** to complete the film look
7. **Assemble clips** into a finished reel with transitions and audio normalization

This sampling approach keeps costs and processing time manageable — a 30-second clip at 30fps has 900 frames, but the lighting within a single clip rarely changes dramatically, so correcting 3 representative frames and interpolating the result produces visually consistent output.

---

## What We Need from Perfectly Clear

### API Access for Development

We're building Roll as a native iOS app and need API access to integrate Perfectly Clear into our cloud processing pipeline. Our backend sends photos (and sampled video frames) to the Perfectly Clear API for correction, then retrieves the corrected images for further processing (LUT application, grain, finishing).

Our integration would work as follows:

- **Input:** JPEG images sent to the API via signed URL or direct upload
- **Processing:** Perfectly Clear applies automated correction (white balance, exposure, skin tone, sharpening, noise reduction, scene detection)
- **Output:** Corrected JPEG returned for our pipeline to continue processing

We'd configure a custom correction preset tuned for Roll's use case — moderate exposure correction (preserve artistic intent), warm white balance bias, high skin tone accuracy priority (our primary users are parents photographing children), light sharpening, and moderate noise reduction.

### Volume and Usage Pattern

Each "roll" contains up to 36 photos. Each "reel" generates approximately 3–15 API calls (3 sampled frames per clip, with reels containing 3–15 clips). Processing is batched — a user develops a roll or reel, and all images in that batch are sent to the API in sequence. This is not a real-time, per-photo workflow; it's a batch processing model where the user submits a roll and receives a notification when development is complete.

### LUT Application Question

One specific technical question: **Can Perfectly Clear apply a custom LUT on top of the color correction in a single pass?**

Our current pipeline is two steps — Perfectly Clear corrects the image, we download the result, then we apply our film profile LUT separately. If Perfectly Clear can accept a .cube LUT file and apply it after correction (for both individual photos and for the sampled video frames), that would simplify our pipeline and reduce round-trip latency. We have six film profiles, each defined as a .cube LUT, and we'd want to apply the appropriate one as a post-correction step. Is this something the API supports for both photo and video frame inputs?

### Development Timeline Needs

We need API access during development to build and test the integration. Our processing pipeline is a core feature — it's what differentiates Roll from a simple photo gallery. Being able to test with real Perfectly Clear output during development is important for tuning our film profiles (LUTs) and ensuring the two-step pipeline (correction → grading) produces the quality we're targeting.

---

## Summary

Roll is a native iOS app that helps people organize, develop, and print their best photos and videos using a film photography metaphor. Perfectly Clear's automated color correction is the foundation of our processing pipeline — it normalizes phone photos and video frames to a consistent, high-quality baseline, on top of which we apply creative film stock grading via LUTs.

We're looking for API access to integrate Perfectly Clear into our cloud processing backend, and we'd like to discuss whether LUT application can be handled on your end as part of the correction pass.

We're happy to share more technical detail or walk through the integration architecture in more depth.
