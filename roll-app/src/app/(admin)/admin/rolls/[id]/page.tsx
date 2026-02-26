'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface RollDetail {
  id: string;
  name: string | null;
  status: string;
  film_profile: string | null;
  photo_count: number;
  max_photos: number;
  user_id: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  processing_error: string | null;
  photos_processed: number | null;
  correction_skipped_count: number | null;
  created_at: string;
  updated_at: string;
}

export default function AdminRollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [roll, setRoll] = useState<RollDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoll = useCallback(async () => {
    try {
      // Fetch using the service client via a simple query param approach
      const res = await fetch(`/api/admin/rolls?rollId=${id}`);
      if (res.ok) {
        const data = await res.json();
        // Find the specific roll
        const found = data.rolls?.find((r: RollDetail) => r.id === id);
        if (found) setRoll(found);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoll();
  }, [fetchRoll]);

  if (loading || !roll) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
        >
          &larr; Back
        </button>
        <div className="h-48 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/rolls')}
        className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
      >
        &larr; Back to rolls
      </button>

      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-[family-name:var(--font-display)] text-lg font-medium">
            {roll.name || 'Untitled Roll'}
          </h1>
          <StatusBadge status={roll.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Photos</p>
            <p className="text-lg font-medium">
              {roll.photo_count}/{roll.max_photos}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Film Profile</p>
            <p className="text-lg font-medium">{roll.film_profile || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Created</p>
            <p className="text-sm">{new Date(roll.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">User</p>
            <a
              href={`/admin/users/${roll.user_id}`}
              className="text-sm text-[var(--color-action)] hover:underline truncate block"
            >
              {roll.user_id.slice(0, 8)}...
            </a>
          </div>
        </div>

        {roll.processing_error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-[var(--radius-sharp)] text-sm text-red-400">
            <span className="font-medium">Error: </span>
            {roll.processing_error}
          </div>
        )}

        {roll.processing_started_at && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">
                Processing Started
              </p>
              <p>{new Date(roll.processing_started_at).toLocaleString()}</p>
            </div>
            {roll.processing_completed_at && (
              <div>
                <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Completed</p>
                <p>{new Date(roll.processing_completed_at).toLocaleString()}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Photos Processed</p>
              <p>{roll.photos_processed ?? '—'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
