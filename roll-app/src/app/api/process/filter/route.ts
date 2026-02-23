import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { runFilterPipeline } from '@/lib/processing/pipeline';
import { processLimiter } from '@/lib/rate-limit';
import type { FilterResult } from '@/types/photo';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              /* Server Component */
            }
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimited = processLimiter.check(user.id);
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { jobId, photoIds } = body as { jobId: string; photoIds: string[] };

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return NextResponse.json({ error: 'Invalid request: photoIds required' }, { status: 400 });
    }

    // Mark job as processing
    if (jobId) {
      await supabase
        .from('processing_jobs')
        .update({ status: 'processing', started_at: new Date().toISOString() })
        .eq('id', jobId);
    }

    // Fetch photo records
    const { data: photos, error: fetchError } = await supabase
      .from('photos')
      .select('id, storage_key, width, height, camera_make, camera_model')
      .in('id', photoIds)
      .eq('user_id', user.id);

    if (fetchError) throw fetchError;
    if (!photos || photos.length === 0) {
      return NextResponse.json({ error: 'No photos found' }, { status: 404 });
    }

    // Run pipeline
    await runFilterPipeline(photos, async (photoId: string, result: FilterResult) => {
      await supabase
        .from('photos')
        .update({
          filter_status: result.filter_status,
          filter_reason: result.filter_reason,
          aesthetic_score: result.aesthetic_score,
          phash: result.phash,
          face_count: result.face_count,
          scene_classification: result.scene_classification,
        })
        .eq('id', photoId);
    });

    // Mark job as completed
    if (jobId) {
      await supabase
        .from('processing_jobs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', jobId);
    }

    return NextResponse.json({ message: 'Filtering complete', processed: photos.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
