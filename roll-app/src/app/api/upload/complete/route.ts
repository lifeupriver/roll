import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createThumbnail, generateLqip } from '@/lib/processing/sharp';
import { uploadObject, getObject, getThumbnailUrl, getThumbnailKey } from '@/lib/storage/r2';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { photos } = body as {
      photos: Array<{
        storageKey: string;
        contentHash: string;
        filename: string;
        contentType: string;
        sizeBytes: number;
        width: number;
        height: number;
        exifData: {
          dateTaken?: string;
          latitude?: number;
          longitude?: number;
          cameraMake?: string;
          cameraModel?: string;
        };
        thumbnailBase64?: string;
      }>;
    };

    if (!photos || !Array.isArray(photos)) {
      return NextResponse.json({ error: 'Invalid request: photos array required' }, { status: 400 });
    }

    // Validate all storage keys belong to the authenticated user
    const expectedPrefix = `originals/${user.id}/`;
    for (const photo of photos) {
      if (!photo.storageKey || !photo.storageKey.startsWith(expectedPrefix)) {
        return NextResponse.json(
          { error: 'Invalid storage key: does not match authenticated user' },
          { status: 403 }
        );
      }
    }

    let duplicatesSkipped = 0;
    const photoRecords = [];
    const photoIds: string[] = [];

    for (const photo of photos) {
      // Check for duplicate content hash
      const { data: existing } = await supabase
        .from('photos')
        .select('id')
        .eq('user_id', user.id)
        .eq('content_hash', photo.contentHash)
        .limit(1);

      if (existing && existing.length > 0) {
        duplicatesSkipped++;
        continue;
      }

      // Generate thumbnail
      let thumbnailUrl = '';
      let lqipBase64 = photo.thumbnailBase64 || null;

      try {
        const originalBuffer = await getObject(photo.storageKey);
        const thumbnailBuffer = await createThumbnail(originalBuffer);
        const thumbKey = getThumbnailKey(user.id, photo.contentHash);
        await uploadObject(thumbKey, thumbnailBuffer, 'image/webp');
        thumbnailUrl = getThumbnailUrl(user.id, photo.contentHash);

        if (!lqipBase64) {
          lqipBase64 = await generateLqip(originalBuffer);
        }
      } catch {
        thumbnailUrl = '';
      }

      const id = randomUUID();
      photoIds.push(id);

      photoRecords.push({
        id,
        user_id: user.id,
        storage_key: photo.storageKey,
        thumbnail_url: thumbnailUrl,
        lqip_base64: lqipBase64,
        filename: photo.filename,
        content_hash: photo.contentHash,
        content_type: photo.contentType,
        size_bytes: photo.sizeBytes,
        width: photo.width,
        height: photo.height,
        date_taken: photo.exifData.dateTaken || null,
        latitude: photo.exifData.latitude || null,
        longitude: photo.exifData.longitude || null,
        camera_make: photo.exifData.cameraMake || null,
        camera_model: photo.exifData.cameraModel || null,
        filter_status: 'pending',
      });
    }

    if (photoRecords.length > 0) {
      const { error: insertError } = await supabase.from('photos').insert(photoRecords);
      if (insertError) throw insertError;
    }

    // Queue filtering job
    let filterJobId = null;
    if (photoIds.length > 0) {
      const { data: job, error: jobError } = await supabase
        .from('processing_jobs')
        .insert({
          user_id: user.id,
          type: 'filter',
          status: 'pending',
          payload: { photoIds },
        })
        .select('id')
        .single();

      if (!jobError && job) {
        filterJobId = job.id;
      }
    }

    return NextResponse.json({
      created: photoRecords.length,
      duplicatesSkipped,
      photoIds,
      filterJobId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
