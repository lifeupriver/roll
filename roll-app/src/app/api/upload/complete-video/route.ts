import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getThumbnailUrl } from '@/lib/storage/r2';
import { parseBody, completeVideoUploadSchema } from '@/lib/validation';
import { captureError } from '@/lib/sentry';
import { randomUUID } from 'crypto';
import {
  DURATION_FLASH_MAX_MS,
  DURATION_MOMENT_MAX_MS,
} from '@/lib/utils/constants';

function categorizeDuration(durationMs: number): 'flash' | 'moment' | 'scene' {
  if (durationMs <= DURATION_FLASH_MAX_MS) return 'flash';
  if (durationMs <= DURATION_MOMENT_MAX_MS) return 'moment';
  return 'scene';
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = await parseBody(request, completeVideoUploadSchema);
    if (parsed.error) return parsed.error;
    const { videos } = parsed.data;

    // Validate storage keys belong to user
    const expectedPrefix = `originals/${user.id}/`;
    for (const video of videos) {
      if (!video.storageKey?.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: 'Invalid storage key: does not match authenticated user' },
          { status: 403 },
        );
      }
    }

    let duplicatesSkipped = 0;
    const videoRecords = [];
    const videoIds: string[] = [];

    for (const video of videos) {
      // Check for duplicate content hash
      const { data: existing } = await supabase
        .from('photos')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_hash', video.contentHash)
        .limit(1);

      if (existing && existing.length > 0) {
        duplicatesSkipped++;
        continue;
      }

      const id = randomUUID();
      videoIds.push(id);

      // Use client-provided thumbnail or empty string
      const thumbnailUrl = video.thumbnailBase64
        ? getThumbnailUrl(user.id, video.contentHash)
        : '';

      videoRecords.push({
        id,
        user_id: user.id,
        storage_key: video.storageKey,
        thumbnail_url: thumbnailUrl,
        lqip_base64: video.thumbnailBase64 || null,
        filename: video.filename,
        content_hash: video.contentHash,
        content_type: video.contentType,
        size_bytes: video.sizeBytes,
        width: video.width,
        height: video.height,
        date_taken: video.exifData.dateTaken || null,
        latitude: video.exifData.latitude || null,
        longitude: video.exifData.longitude || null,
        camera_make: video.exifData.cameraMake || null,
        camera_model: video.exifData.cameraModel || null,
        filter_status: 'pending',
        media_type: 'video',
        duration_ms: video.durationMs,
        duration_category: categorizeDuration(video.durationMs),
      });
    }

    if (videoRecords.length > 0) {
      const { error: insertError } = await supabase.from('photos').insert(videoRecords);
      if (insertError) throw insertError;
    }

    // Queue video filtering job
    let filterJobId = null;
    if (videoIds.length > 0) {
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: user.id,
          type: 'filter_video',
          status: 'pending',
          payload: { videoIds },
        })
        .select('id')
        .single();

      if (!jobError && job) {
        filterJobId = job.id;
      }
    }

    return NextResponse.json({
      created: videoRecords.length,
      duplicatesSkipped,
      videoIds,
      filterJobId,
    });
  } catch (err) {
    captureError(err, { context: 'upload-complete-video' });
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
