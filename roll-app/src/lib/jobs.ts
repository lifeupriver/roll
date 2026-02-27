import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { captureError } from '@/lib/sentry';

/**
 * Lightweight background job dispatcher.
 *
 * Instead of running long-running work (e.g. image processing) inline in the
 * HTTP request handler, the route inserts a job row and calls `dispatchJob` to
 * kick off an async "fire-and-forget" processor.
 *
 * The processor runs outside the request lifecycle via `waitUntil` (Vercel) or
 * falls back to an unref'd promise. The job table acts as a durable queue —
 * failed jobs are marked 'failed' with an error message for retry/debugging.
 *
 * For production at scale, replace `dispatchJob` internals with a proper queue
 * (e.g. Inngest, Trigger.dev, BullMQ, or a cron-based poller).
 */

// ---------------------------------------------------------------------------
// Service client (bypasses RLS)
// ---------------------------------------------------------------------------

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase service role configuration');
  }
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Job types and processor registry
// ---------------------------------------------------------------------------

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface Job {
  id: string;
  user_id: string;
  type: string;
  status: JobStatus;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

type JobProcessor = (job: Job, supabase: SupabaseClient) => Promise<void>;

const processors = new Map<string, JobProcessor>();

/** Register a processor function for a given job type. */
export function registerProcessor(type: string, processor: JobProcessor) {
  processors.set(type, processor);
}

// ---------------------------------------------------------------------------
// Job lifecycle
// ---------------------------------------------------------------------------

/** Create a new job row and return its ID. */
export async function enqueueJob(
  userId: string,
  type: string,
  payload: Record<string, unknown>
): Promise<string> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from('processing_jobs')
    .insert({
      user_id: userId,
      type,
      status: 'pending',
      payload,
      attempts: 0,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`Failed to enqueue job: ${error?.message ?? 'Unknown error'}`);
  }

  return data.id;
}

/**
 * Fire-and-forget: pick up a pending job and run its processor.
 *
 * Designed to be called with `waitUntil(dispatchJob(jobId))` or
 * simply `dispatchJob(jobId).catch(captureError)` when `waitUntil`
 * is not available.
 */
export async function dispatchJob(jobId: string): Promise<void> {
  const supabase = getServiceSupabase();

  // Claim the job (atomic: only transitions from 'pending')
  const { data: job, error: claimError } = await supabase
    .from('processing_jobs')
    .update({
      status: 'running',
      started_at: new Date().toISOString(),
      attempts: 1, // TODO: increment via RPC for retry support
    })
    .eq('id', jobId)
    .eq('status', 'pending')
    .select('*')
    .single();

  if (claimError || !job) {
    // Already claimed or does not exist — nothing to do
    return;
  }

  const processor = processors.get(job.type);
  if (!processor) {
    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error: `No processor registered for job type: ${job.type}`,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    return;
  }

  try {
    await processor(job as Job, supabase);

    await supabase
      .from('processing_jobs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    captureError(err, { context: 'job-dispatch', jobId, jobType: job.type });

    await supabase
      .from('processing_jobs')
      .update({
        status: 'failed',
        error: message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
  }
}
