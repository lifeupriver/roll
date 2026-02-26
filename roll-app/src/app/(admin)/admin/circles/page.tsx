'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';

interface CircleData {
  total: number;
  totalPosts: number;
  totalReactions: number;
  totalComments: number;
  avgMembers: string;
  topCircles: Array<{
    id: string;
    name: string;
    member_count: number;
    postCount: number;
    created_at: string;
  }>;
}

export default function AdminCirclesPage() {
  const [data, setData] = useState<CircleData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/circles');
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
          Circle Analytics
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
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
        Circle Analytics
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Total Circles" value={data.total} />
        <StatCard label="Avg Members" value={data.avgMembers} />
        <StatCard label="Total Posts" value={data.totalPosts} />
        <StatCard label="Reactions" value={data.totalReactions} />
        <StatCard label="Comments" value={data.totalComments} />
      </div>

      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Top Circles
        </h2>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {data.topCircles.map((circle) => (
            <div key={circle.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{circle.name}</p>
                <p className="text-xs text-[var(--color-ink-tertiary)]">
                  Created {new Date(circle.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span>{circle.member_count} members</span>
                <span className="text-[var(--color-ink-tertiary)]">{circle.postCount} posts</span>
              </div>
            </div>
          ))}
          {data.topCircles.length === 0 && (
            <p className="p-6 text-center text-sm text-[var(--color-ink-tertiary)]">
              No circles yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
