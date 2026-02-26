'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface PipelineData {
  total: number;
  statusBreakdown: Record<string, number>;
  typeBreakdown: Record<string, number>;
  processingTimeMs: { p50: number; p95: number; p99: number };
  failedJobs: Array<{
    id: string;
    type: string;
    status: string;
    error_message: string | null;
    attempts: number;
    max_attempts: number;
    created_at: string;
  }>;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export default function AdminPipelinePage() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/pipeline');
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // Poll every 15s for pipeline
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
          Processing Pipeline
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
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">
          Processing Pipeline
        </h1>
        <span className="text-xs text-[var(--color-ink-tertiary)]">Auto-refreshes every 15s</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Pending" value={data.statusBreakdown['pending'] ?? 0} />
        <StatCard label="Processing" value={data.statusBreakdown['processing'] ?? 0} />
        <StatCard label="Completed" value={data.statusBreakdown['completed'] ?? 0} />
        <StatCard label="Failed" value={data.statusBreakdown['failed'] ?? 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Processing Times */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Processing Latency
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">p50</p>
              <p className="text-lg font-medium">{formatMs(data.processingTimeMs.p50)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">p95</p>
              <p className="text-lg font-medium">{formatMs(data.processingTimeMs.p95)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">p99</p>
              <p className="text-lg font-medium">{formatMs(data.processingTimeMs.p99)}</p>
            </div>
          </div>
        </div>

        {/* Job Types */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Job Types
          </h2>
          <div className="space-y-2">
            {Object.entries(data.typeBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm">{type}</span>
                <span className="text-sm font-medium">{count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Failed Jobs */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Failed Jobs ({data.failedJobs.length})
        </h2>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {data.failedJobs.length === 0 ? (
            <p className="p-6 text-center text-sm text-[var(--color-ink-tertiary)]">
              No failed jobs
            </p>
          ) : (
            data.failedJobs.map((job) => (
              <div key={job.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={job.type} />
                    <span className="text-xs text-[var(--color-ink-tertiary)]">
                      Attempt {job.attempts}/{job.max_attempts}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-ink-tertiary)]">
                    {new Date(job.created_at).toLocaleString()}
                  </span>
                </div>
                {job.error_message && (
                  <p className="text-xs text-red-400 font-mono mt-1 truncate">
                    {job.error_message}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
