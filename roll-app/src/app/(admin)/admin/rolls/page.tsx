'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface RollAnalytics {
  total: number;
  statusBreakdown: Record<string, number>;
  filmProfileBreakdown: [string, number][];
  avgProcessingTimeMins: number;
  errorRate: number;
  avgPhotosPerRoll: number;
  rolls: Array<{
    id: string;
    name: string | null;
    status: string;
    film_profile: string | null;
    photo_count: number;
    user_id: string;
    created_at: string;
    updated_at: string;
    processing_error: string | null;
  }>;
}

export default function AdminRollsPage() {
  const router = useRouter();
  const [data, setData] = useState<RollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/rolls${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
          Roll Analytics
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Roll Analytics</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Rolls" value={data.total} />
        <StatCard label="Avg Photos/Roll" value={data.avgPhotosPerRoll.toFixed(1)} />
        <StatCard label="Avg Processing" value={`${data.avgProcessingTimeMins.toFixed(1)}m`} />
        <StatCard label="Error Rate" value={`${data.errorRate.toFixed(1)}%`} />
        <StatCard label="Developed" value={data.statusBreakdown['developed'] ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Status Breakdown
          </h2>
          <div className="space-y-2">
            {Object.entries(data.statusBreakdown).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={`flex items-center justify-between w-full px-2 py-1.5 rounded-[var(--radius-sharp)] transition-colors ${
                  statusFilter === status
                    ? 'bg-[var(--color-action-subtle)]'
                    : 'hover:bg-[var(--color-surface-sunken)]'
                }`}
              >
                <StatusBadge status={status} />
                <span className="text-sm font-medium">{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Film Profile Popularity */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Film Profile Popularity
          </h2>
          <div className="space-y-1.5">
            {data.filmProfileBreakdown.map(([profile, count]) => {
              const max = data.filmProfileBreakdown[0]?.[1] ?? 1;
              return (
                <div key={profile} className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-ink-secondary)] w-16 text-right">
                    {profile}
                  </span>
                  <div className="flex-1 h-5 bg-[var(--color-surface-sunken)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-action)] rounded"
                      style={{ width: `${(count / max) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-ink-tertiary)] w-10 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Rolls */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)]">
            Recent Rolls {statusFilter && `(${statusFilter})`}
          </h2>
          {statusFilter && (
            <button
              onClick={() => setStatusFilter('')}
              className="text-xs text-[var(--color-action)] hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {data.rolls.map((roll) => (
            <button
              key={roll.id}
              onClick={() => router.push(`/admin/rolls/${roll.id}`)}
              className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[var(--color-surface-sunken)] transition-colors text-left"
            >
              <div className="min-w-0">
                <p className="text-sm truncate">{roll.name || 'Untitled'}</p>
                <p className="text-xs text-[var(--color-ink-tertiary)]">
                  {roll.photo_count} photos {roll.film_profile ? `· ${roll.film_profile}` : ''}
                  {roll.processing_error ? ` · Error: ${roll.processing_error}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={roll.status} />
                <span className="text-[11px] text-[var(--color-ink-tertiary)]">
                  {new Date(roll.updated_at).toLocaleDateString()}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
