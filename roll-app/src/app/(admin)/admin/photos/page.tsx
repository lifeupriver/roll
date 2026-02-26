'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface PhotoAnalytics {
  total: number;
  filterStatus: Record<string, number>;
  filterReasons: Record<string, number>;
  cameras: [string, number][];
  scenes: [string, number][];
  aestheticDistribution: Record<string, number>;
  avgAestheticScore: number;
}

function BarChart({ data, maxItems = 10 }: { data: [string, number][]; maxItems?: number }) {
  const items = data.slice(0, maxItems);
  const max = Math.max(...items.map(([, v]) => v), 1);

  return (
    <div className="space-y-1.5">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-ink-secondary)] w-28 truncate text-right">
            {label}
          </span>
          <div className="flex-1 h-5 bg-[var(--color-surface-sunken)] rounded overflow-hidden">
            <div
              className="h-full bg-[var(--color-action)] rounded transition-all"
              style={{ width: `${(value / max) * 100}%` }}
            />
          </div>
          <span className="text-xs text-[var(--color-ink-tertiary)] w-12 text-right">
            {value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AdminPhotosPage() {
  const [data, setData] = useState<PhotoAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/photos');
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
          Photo Analytics
        </h1>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const visibleCount = data.filterStatus['visible'] ?? 0;
  const filteredCount = data.filterStatus['filtered_auto'] ?? 0;
  const hiddenCount = data.filterStatus['hidden_manual'] ?? 0;
  const pendingCount = data.filterStatus['pending'] ?? 0;

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
        Photo Analytics
      </h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Photos" value={data.total} />
        <StatCard label="Visible" value={visibleCount} />
        <StatCard label="Auto-Filtered" value={filteredCount} />
        <StatCard label="Avg Aesthetic" value={data.avgAestheticScore.toFixed(2)} />
      </div>

      {/* Filter Status Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Filter Status Breakdown
          </h2>
          <div className="space-y-3">
            {Object.entries(data.filterStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <StatusBadge status={status} />
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-[var(--color-surface-sunken)] rounded overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-action)] rounded"
                      style={{ width: `${(count / data.total) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-ink-secondary)] w-16 text-right">
                    {count.toLocaleString()} ({((count / data.total) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
            {pendingCount > 0 && (
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                {pendingCount} photos still pending filter analysis
              </p>
            )}
            {hiddenCount > 0 && (
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                {hiddenCount} photos manually hidden by users
              </p>
            )}
          </div>
        </div>

        {/* Filter Reasons */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Filter Reasons
          </h2>
          <BarChart data={Object.entries(data.filterReasons).sort(([, a], [, b]) => b - a)} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Camera Breakdown */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Top Cameras
          </h2>
          <BarChart data={data.cameras} maxItems={10} />
        </div>

        {/* Scene Classification */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Scene Classification
          </h2>
          <div className="flex flex-wrap gap-2">
            {data.scenes.map(([label, count]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 px-2 py-1 bg-[var(--color-surface-sunken)] rounded text-xs"
              >
                {label} <span className="text-[var(--color-ink-tertiary)]">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
