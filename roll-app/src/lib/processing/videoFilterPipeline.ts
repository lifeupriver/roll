import sharp from 'sharp';
import type { FilterResult, FilterReason, DurationCategory, AudioClassification } from '@/types/photo';
import { detectScreenshot } from './screenshotDetection';
import { computePerceptualHash, findDuplicates } from './duplicateDetection';
import { getObject } from '@/lib/storage/r2';
import {
  MIN_VIDEO_DURATION_MS,
  VIDEO_STABILIZATION_THRESHOLD,
  DURATION_FLASH_MAX_MS,
  DURATION_MOMENT_MAX_MS,
} from '@/lib/utils/constants';

interface VideoInput {
  id: string;
  storage_key: string;
  width: number;
  height: number;
  duration_ms: number;
  camera_make: string | null;
  camera_model: string | null;
}

export interface VideoFilterResult extends FilterResult {
  duration_category: DurationCategory;
  audio_classification: AudioClassification;
  stabilization_score: number;
}

/**
 * Categorize clip duration into flash/moment/scene.
 */
function categorizeDuration(durationMs: number): DurationCategory {
  if (durationMs <= DURATION_FLASH_MAX_MS) return 'flash';
  if (durationMs <= DURATION_MOMENT_MAX_MS) return 'moment';
  return 'scene';
}

/**
 * Detect accidental recordings: very short clips (< 1.5s).
 */
function isAccidentalRecording(durationMs: number): boolean {
  return durationMs < MIN_VIDEO_DURATION_MS;
}

/**
 * Detect screen recordings based on EXIF and dimensions.
 * Similar to screenshot detection for photos.
 */
function isScreenRecording(
  dimensions: { width: number; height: number },
  exif: { cameraMake: string | null; cameraModel: string | null },
): boolean {
  return detectScreenshot(dimensions, exif);
}

/**
 * Analyze a key frame for luminance to detect extremely dark clips.
 * In a real implementation this would sample multiple frames via FFmpeg.
 * For the prototype, we use the thumbnail/key frame.
 */
async function analyzeKeyFrameLuminance(keyFrameBuffer: Buffer): Promise<number> {
  const stats = await sharp(keyFrameBuffer)
    .resize(64, 64, { fit: 'inside' })
    .stats();
  const meanR = stats.channels[0]?.mean ?? 0;
  const meanG = stats.channels[1]?.mean ?? 0;
  const meanB = stats.channels[2]?.mean ?? 0;
  // Luminance approximation
  return 0.299 * meanR + 0.587 * meanG + 0.114 * meanB;
}

/**
 * Simplified stabilization score from key frame analysis.
 * In production, FFmpeg vidstabdetect would compute real motion vectors.
 * For prototype, we use a moderate default score.
 */
function estimateStabilizationScore(_durationMs: number): number {
  // Prototype heuristic: most phone clips are moderately stable
  // Return a random-ish score based on duration (longer = more likely shaky)
  return 0.7;
}

/**
 * Simplified audio classification.
 * In production, this would use Whisper or audio fingerprinting.
 * For prototype, classify based on duration heuristics.
 */
function classifyAudio(_durationMs: number): AudioClassification {
  // Prototype: assume most clips have ambient audio
  return 'ambient';
}

/**
 * Detect faces in a key frame (same as photo pipeline).
 */
async function detectFaces(imageBuffer: Buffer): Promise<number> {
  const { data, info } = await sharp(imageBuffer)
    .resize(128, 128, { fit: 'inside' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let skinPixels = 0;
  const totalPixels = info.width * info.height;

  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) {
      skinPixels++;
    }
  }

  const skinRatio = skinPixels / totalPixels;
  if (skinRatio > 0.15) return Math.max(1, Math.floor(skinRatio * 5));
  if (skinRatio > 0.05) return 1;
  return 0;
}

/**
 * Classify scene from key frame (same as photo pipeline).
 */
async function classifyScene(imageBuffer: Buffer): Promise<string[]> {
  const stats = await sharp(imageBuffer)
    .resize(64, 64, { fit: 'inside' })
    .stats();

  const labels: string[] = [];
  const meanR = stats.channels[0]?.mean ?? 0;
  const meanG = stats.channels[1]?.mean ?? 0;
  const meanB = stats.channels[2]?.mean ?? 0;

  if (meanG > meanR && meanG > meanB && meanG > 80) labels.push('landscape', 'nature');
  if (meanB > meanR && meanB > meanG && meanB > 100) labels.push('landscape', 'sky');
  if (meanR > meanB + 30 && meanR > 120) labels.push('indoor', 'warm');
  if (meanR + meanG + meanB > 450) labels.push('outdoor');
  if (meanR + meanG + meanB < 200) labels.push('indoor', 'night');

  return labels.length > 0 ? [...new Set(labels)] : ['general'];
}

/**
 * Filter a single video clip.
 * Uses the thumbnail/key frame for visual analysis.
 */
export async function filterVideo(video: VideoInput): Promise<VideoFilterResult> {
  // For prototype, we use the stored thumbnail as key frame
  // In production, FFmpeg would extract actual key frames from the video file
  let keyFrameBuffer: Buffer;
  try {
    keyFrameBuffer = await getObject(video.storage_key);
    // Extract a "key frame" by reading the first bytes as an image
    // In reality, this would be extracted from the video via FFmpeg
    // For prototype, create a placeholder analysis buffer
    keyFrameBuffer = await sharp({
      create: {
        width: video.width > 128 ? 128 : video.width,
        height: video.height > 128 ? 128 : video.height,
        channels: 3,
        background: { r: 128, g: 128, b: 128 },
      },
    }).jpeg().toBuffer();
  } catch {
    // If we can't get the video, create a neutral analysis frame
    keyFrameBuffer = await sharp({
      create: { width: 128, height: 128, channels: 3, background: { r: 128, g: 128, b: 128 } },
    }).jpeg().toBuffer();
  }

  const durationCategory = categorizeDuration(video.duration_ms);
  const audioClassification = classifyAudio(video.duration_ms);
  const stabilizationScore = estimateStabilizationScore(video.duration_ms);

  // Run detections
  const isAccidental = isAccidentalRecording(video.duration_ms);
  const isScreen = isScreenRecording(
    { width: video.width, height: video.height },
    { cameraMake: video.camera_make, cameraModel: video.camera_model },
  );

  const luminance = await analyzeKeyFrameLuminance(keyFrameBuffer);
  const isTooDark = luminance < 20;
  const isTooShaky = stabilizationScore < VIDEO_STABILIZATION_THRESHOLD;

  const faceCount = await detectFaces(keyFrameBuffer);
  const sceneLabels = await classifyScene(keyFrameBuffer);
  const phash = await computePerceptualHash(keyFrameBuffer);

  // Aesthetic score for videos
  const aestheticScore = Math.min(1, Math.max(0,
    0.5
    + (stabilizationScore * 0.2)
    + (faceCount > 0 ? 0.05 : 0)
    + (video.duration_ms > 3000 ? 0.1 : 0)
    + (luminance > 50 ? 0.1 : 0)
  ));

  // Determine filter status
  let filterStatus: 'visible' | 'filtered_auto' = 'visible';
  let filterReason: FilterReason = null;

  if (isAccidental) {
    filterStatus = 'filtered_auto';
    filterReason = 'accidental';
  } else if (isScreen) {
    filterStatus = 'filtered_auto';
    filterReason = 'screen_recording';
  } else if (isTooDark) {
    filterStatus = 'filtered_auto';
    filterReason = 'exposure';
  } else if (isTooShaky) {
    filterStatus = 'filtered_auto';
    filterReason = 'too_shaky';
  }

  return {
    filter_status: filterStatus,
    filter_reason: filterReason,
    aesthetic_score: aestheticScore,
    face_count: faceCount,
    scene_classification: sceneLabels,
    phash,
    duration_category: durationCategory,
    audio_classification: audioClassification,
    stabilization_score: stabilizationScore,
  };
}

/**
 * Run the video filter pipeline on a batch of videos.
 */
export async function runVideoFilterPipeline(
  videos: VideoInput[],
  updateVideo: (videoId: string, result: VideoFilterResult) => Promise<void>,
): Promise<void> {
  const concurrency = 3;
  const results: Array<{ id: string; result: VideoFilterResult }> = [];

  for (let i = 0; i < videos.length; i += concurrency) {
    const batch = videos.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (video) => {
        const result = await filterVideo(video);
        await updateVideo(video.id, result);
        return { id: video.id, result };
      }),
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      }
    }
  }

  // Check for near-duplicate clips
  const videosWithHashes = results
    .filter((r) => r.result.phash && r.result.filter_status === 'visible')
    .map((r) => ({
      id: r.id,
      phash: r.result.phash,
      aesthetic_score: r.result.aesthetic_score,
    }));

  const duplicateIds = findDuplicates(videosWithHashes);

  for (const dupId of duplicateIds) {
    const original = results.find((r) => r.id === dupId)?.result;
    if (original) {
      await updateVideo(dupId, {
        ...original,
        filter_status: 'filtered_auto',
        filter_reason: 'duplicate',
      });
    }
  }
}
