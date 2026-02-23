import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { FILM_PROFILE_CONFIGS } from '@/lib/processing/filmProfiles';
import type { FilmProfileId } from '@/types/roll';
import { MIN_ROLL_PHOTOS, MAX_ROLL_PHOTOS } from '@/lib/utils/constants';
import { captureError } from '@/lib/sentry';
import { processLimiter } from '@/lib/rate-limit';
import { parseBody, developProcessSchema } from '@/lib/validation';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    // Step 3: Process each photo
    for (let i = 0; i < rollPhotos.length; i++) {
      const photo = rollPhotos[i];

      // Simulate processing: set processed_storage_key and correction_applied
      const processedKey = `processed/${user.id}/${rollId}/${photo.position}_${filmProfileId}.jpg`;

      const { error: photoUpdateError } = await supabase
        .from('roll_photos')
        .update({
          processed_storage_key: processedKey,
          correction_applied: true,
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

      // Simulate processing time
      await delay(100);
    }

    // Step 4: Set roll status to 'developed'
    const { error: completeError } = await supabase
      .from('rolls')
      .update({
        status: 'developed',
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', rollId);

    if (completeError) {
      throw new Error(`Failed to mark roll as developed: ${completeError.message}`);
    }

    // Step 5: Return success
    return NextResponse.json({
      data: { rollId, status: 'developed' },
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
