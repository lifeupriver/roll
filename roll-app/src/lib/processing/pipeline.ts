import sharp from 'sharp';
import type { FilterResult } from '@/types/photo';
import { detectScreenshot } from './screenshotDetection';
import { detectBlur, isBlurry } from './blurDetection';
import { computePerceptualHash, findDuplicates } from './duplicateDetection';
import { detectExposure } from './exposureDetection';
import { detectTextRegions, isDocument } from './documentDetection';
import { getObject } from '@/lib/storage/r2';
import { BLUR_THRESHOLD } from '@/lib/utils/constants';

interface PhotoInput {
  id: string;
  storage_key: string;
  width: number;
  height: number;
  camera_make: string | null;
  camera_model: string | null;
}

async function detectFaces(imageBuffer: Buffer): Promise<number> {
  // Simplified face detection using skin-tone pixel analysis
  // Production would use TensorFlow.js or a proper face detection model
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

    // Simple skin tone detection heuristic
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r - g) > 15 && r - b > 15) {
      skinPixels++;
    }
  }

  const skinRatio = skinPixels / totalPixels;

  // Rough estimate: significant skin area suggests faces
  if (skinRatio > 0.15) return Math.max(1, Math.floor(skinRatio * 5));
  if (skinRatio > 0.05) return 1;
  return 0;
}

async function classifyScene(imageBuffer: Buffer): Promise<string[]> {
  // Simplified scene classification based on color analysis
  const stats = await sharp(imageBuffer).resize(64, 64, { fit: 'inside' }).stats();

  const labels: string[] = [];

  const meanR = stats.channels[0]?.mean ?? 0;
  const meanG = stats.channels[1]?.mean ?? 0;
  const meanB = stats.channels[2]?.mean ?? 0;

  // Green dominant → landscape/nature
  if (meanG > meanR && meanG > meanB && meanG > 80) {
    labels.push('landscape', 'nature');
  }

  // Blue dominant → sky/water
  if (meanB > meanR && meanB > meanG && meanB > 100) {
    labels.push('landscape', 'sky');
  }

  // Warm tones → indoor/portrait
  if (meanR > meanB + 30 && meanR > 120) {
    labels.push('indoor', 'warm');
  }

  // Very bright overall → outdoor
  if (meanR + meanG + meanB > 450) {
    labels.push('outdoor');
  }

  // Dark overall → indoor/night
  if (meanR + meanG + meanB < 200) {
    labels.push('indoor', 'night');
  }

  if (labels.length === 0) {
    labels.push('general');
  }

  return [...new Set(labels)];
}

function computeAestheticScore(params: {
  blurScore: number;
  stats: { channels: Array<{ mean: number; stdev: number }> };
  faceCount: number;
}): number {
  let score = 0.5;

  // Sharpness bonus
  const normalizedBlur = Math.min(params.blurScore / 1000, 1);
  score += normalizedBlur * 0.2;

  // Good exposure bonus
  const meanBrightness = params.stats.channels[0]?.mean ?? 128;
  const exposureScore = 1 - Math.abs(meanBrightness - 128) / 128;
  score += exposureScore * 0.15;

  // Contrast bonus
  const stdev = params.stats.channels[0]?.stdev ?? 0;
  const contrastScore = Math.min(stdev / 80, 1);
  score += contrastScore * 0.1;

  // Face bonus
  if (params.faceCount > 0) {
    score += 0.05;
  }

  return Math.max(0, Math.min(1, score));
}

export async function filterPhoto(photo: PhotoInput): Promise<FilterResult> {
  const imageBuffer = await getObject(photo.storage_key);
  const stats = await sharp(imageBuffer).stats();

  // Run detections
  const isScreenshotResult = detectScreenshot(
    { width: photo.width, height: photo.height },
    { cameraMake: photo.camera_make, cameraModel: photo.camera_model }
  );

  const blurScore = await detectBlur(imageBuffer);
  const blurryResult = isBlurry(blurScore, BLUR_THRESHOLD);

  const { isOverExposed, isUnderExposed } = detectExposure(stats);

  const textRatio = await detectTextRegions(imageBuffer);
  const documentResult = isDocument(textRatio);

  const phash = await computePerceptualHash(imageBuffer);
  const faceCount = await detectFaces(imageBuffer);
  const sceneLabels = await classifyScene(imageBuffer);

  const aestheticScore = computeAestheticScore({ blurScore, stats, faceCount });

  // Determine filter status
  let filterStatus: 'visible' | 'filtered_auto' = 'visible';
  let filterReason: string | null = null;

  if (isScreenshotResult) {
    filterStatus = 'filtered_auto';
    filterReason = 'screenshot';
  } else if (blurryResult) {
    filterStatus = 'filtered_auto';
    filterReason = 'blur';
  } else if (isOverExposed || isUnderExposed) {
    filterStatus = 'filtered_auto';
    filterReason = 'exposure';
  } else if (documentResult) {
    filterStatus = 'filtered_auto';
    filterReason = 'document';
  }

  return {
    filter_status: filterStatus,
    filter_reason: filterReason as FilterResult['filter_reason'],
    aesthetic_score: aestheticScore,
    face_count: faceCount,
    scene_classification: sceneLabels,
    phash,
  };
}

export async function runFilterPipeline(
  photos: PhotoInput[],
  updatePhoto: (photoId: string, result: FilterResult) => Promise<void>
): Promise<void> {
  const concurrency = 5;
  const results: Array<{ id: string; result: FilterResult }> = [];

  for (let i = 0; i < photos.length; i += concurrency) {
    const batch = photos.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (photo) => {
        const result = await filterPhoto(photo);
        await updatePhoto(photo.id, result);
        return { id: photo.id, result };
      })
    );

    for (const r of batchResults) {
      if (r.status === 'fulfilled') {
        results.push(r.value);
      }
    }
  }

  // Check for duplicates across the batch
  const photosWithHashes = results
    .filter((r) => r.result.phash && r.result.filter_status === 'visible')
    .map((r) => ({
      id: r.id,
      phash: r.result.phash,
      aesthetic_score: r.result.aesthetic_score,
    }));

  const duplicateIds = findDuplicates(photosWithHashes);

  for (const dupId of duplicateIds) {
    await updatePhoto(dupId, {
      filter_status: 'filtered_auto',
      filter_reason: 'duplicate',
      aesthetic_score: results.find((r) => r.id === dupId)?.result.aesthetic_score ?? 0,
      face_count: results.find((r) => r.id === dupId)?.result.face_count ?? 0,
      scene_classification: results.find((r) => r.id === dupId)?.result.scene_classification ?? [],
      phash: results.find((r) => r.id === dupId)?.result.phash ?? '',
    });
  }
}
