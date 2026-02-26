import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FILM_PROFILE_CONFIGS } from '@/lib/processing/filmProfiles';
import { MIN_ROLL_PHOTOS, MAX_ROLL_PHOTOS } from '@/lib/utils/constants';
import { captureError } from '@/lib/sentry';
import { processLimiter } from '@/lib/rate-limit';
import { parseBody, developProcessSchema } from '@/lib/validation';
import { correctImage, isCorrectionEnabled, activeCorrectionProvider } from '@/lib/correction';
import { getObject, uploadObject } from '@/lib/storage/r2';

const isPreview = process.env.NEXT_PUBLIC_PREVIEW_MODE === 'true';

export async function POST(request: NextRequest) {
  let supabase: Awaited<ReturnType<typeof createServerSupabaseClient>> | null = null;
  let rollId: string | null = null;

  try {
    supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = processLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const parsed = await parseBody(request, developProcessSchema);
    if (parsed.error) return parsed.error;
    const { filmProfileId } = parsed.data;
    rollId = parsed.data.rollId;

    // Validate film profile config exists
    if (!FILM_PROFILE_CONFIGS[filmProfileId]) {
      return NextResponse.json(
        { error: `Invalid film profile: ${filmProfileId}` },
        { status: 400 }
      );
    }

    // Fetch user profile to check tier
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('tier')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Free users can only use 'warmth'
    if (profile.tier === 'free' && filmProfileId !== 'warmth') {
      return NextResponse.json(
        { error: 'Free users can only use the warmth film profile' },
        { status: 403 }
      );
    }

    // Fetch roll and verify ownership
    const { data: roll, error: rollError } = await supabase
      .from('rolls')
      .select('*')
      .eq('id', rollId)
      .eq('user_id', user.id)
      .single();

    if (rollError || !roll) {
      return NextResponse.json({ error: 'Roll not found' }, { status: 404 });
    }

    // Verify roll status is 'ready'
    if (roll.status !== 'ready') {
      return NextResponse.json(
        { error: `Roll must be in 'ready' status to develop. Current status: '${roll.status}'` },
        { status: 400 }
      );
    }

    // Verify photo count is within range
    if (roll.photo_count < MIN_ROLL_PHOTOS || roll.photo_count > MAX_ROLL_PHOTOS) {
      return NextResponse.json(
        { error: `Roll must have between ${MIN_ROLL_PHOTOS} and ${MAX_ROLL_PHOTOS} photos` },
        { status: 400 }
      );
    }

    // Step 1: Set roll status to 'processing'
    const { error: updateError } = await supabase
      .from('rolls')
      .update({
        status: 'processing',
        film_profile: filmProfileId,
        processing_started_at: new Date().toISOString(),
        processing_error: null,
        photos_processed: 0,
      })
      .eq('id', rollId);

    if (updateError) {
      throw new Error(`Failed to update roll status: ${updateError.message}`);
    }

    // Step 2: Get all roll_photos ordered by position
    const { data: rollPhotos, error: photosError } = await supabase
      .from('roll_photos')
      .select('*')
      .eq('roll_id', rollId)
      .order('position', { ascending: true });

    if (photosError) {
      throw new Error(`Failed to fetch roll photos: ${photosError.message}`);
    }

    if (!rollPhotos || rollPhotos.length === 0) {
      throw new Error('No photos found in roll');
    }

    // Step 3: Process each photo through EyeQ + film profile
    let correctionSkippedCount = 0;

    for (let i = 0; i < rollPhotos.length; i++) {
      const photo = rollPhotos[i];
      const processedKey = isPreview
        ? `corrected/${rollId}/${photo.position}_${filmProfileId}.jpg`
        : `processed/${user.id}/${rollId}/${photo.position}_${filmProfileId}.jpg`;
      let correctionApplied = false;

      try {
        // Fetch the original photo from R2 (or local filesystem in preview mode)
        const { data: photoRecord } = await supabase
          .from('photos')
          .select('storage_key, content_type, thumbnail_url')
          .eq('id', photo.photo_id)
          .single();

        // In preview mode, use thumbnail_url (points to local /photos/ files)
        const storageKey = isPreview
          ? ((photoRecord as Record<string, unknown>)?.thumbnail_url as string)
          : photoRecord?.storage_key;

        if (storageKey) {
          const originalBuffer = await getObject(storageKey);
          const contentType = photoRecord?.content_type || 'image/jpeg';

          // Send to correction provider (EyeQ or Imagen) for AI color correction
          const correctionResult = await correctImage(originalBuffer, contentType);

          if (correctionResult) {
            // Upload corrected image to R2
            await uploadObject(processedKey, correctionResult.correctedBuffer, 'image/jpeg');
            correctionApplied = true;
          } else {
            // No provider configured — upload original as "processed" placeholder
            await uploadObject(processedKey, originalBuffer, contentType);
            correctionSkippedCount++;
          }
        }
      } catch (correctionError) {
        // Correction failed for this photo — continue without correction
        captureError(correctionError, { context: 'photo-correction', photoId: photo.photo_id });
        correctionSkippedCount++;
      }

      // In preview mode, store the R2 public URL so the browser can load it directly
      const storedKey =
        isPreview && process.env.R2_PUBLIC_URL
          ? `${process.env.R2_PUBLIC_URL}/${processedKey}`
          : processedKey;

      const { error: photoUpdateError } = await supabase
        .from('roll_photos')
        .update({
          processed_storage_key: storedKey,
          correction_applied: correctionApplied,
        })
        .eq('id', photo.id);

      if (photoUpdateError) {
        throw new Error(`Failed to update photo ${photo.id}: ${photoUpdateError.message}`);
      }

      // Update roll photos_processed counter
      const { error: counterError } = await supabase
        .from('rolls')
        .update({ photos_processed: i + 1 })
        .eq('id', rollId);

      if (counterError) {
        throw new Error(`Failed to update photos_processed counter: ${counterError.message}`);
      }
    }

    // Step 4: Set roll status to 'developed'
    const { error: completeError } = await supabase
      .from('rolls')
      .update({
        status: 'developed',
        processing_completed_at: new Date().toISOString(),
        correction_skipped_count: correctionSkippedCount,
      })
      .eq('id', rollId);

    if (completeError) {
      throw new Error(`Failed to mark roll as developed: ${completeError.message}`);
    }

    // Step 5: Return success
    return NextResponse.json({
      data: {
        rollId,
        status: 'developed',
        correctionProvider: activeCorrectionProvider(),
        correctionEnabled: isCorrectionEnabled(),
        correctionSkippedCount,
      },
    });
  } catch (err) {
    captureError(err, { context: 'process-develop', rollId });
    const message = err instanceof Error ? err.message : 'Internal server error';

    // Set roll status to 'error' if we have a rollId and supabase client
    if (supabase && rollId) {
      await supabase
        .from('rolls')
        .update({
          status: 'error',
          processing_error: message,
        })
        .eq('id', rollId);
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
