'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';

interface RevenueData {
  plusSubscribers: number;
  estimatedMRRCents: number;
  totalOrderRevenueCents: number;
  totalOrders: number;
  avgOrderValueCents: number;
  freeFirstRollCount: number;
  estimatedFreeRollCostCents: number;
  revenueByMonth: [string, number][];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/revenue');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Revenue</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Revenue</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Est. MRR" value={formatCents(data.estimatedMRRCents)} />
        <StatCard label="Plus Subscribers" value={data.plusSubscribers} />
        <StatCard label="Order Revenue" value={formatCents(data.totalOrderRevenueCents)} />
        <StatCard label="Avg Order Value" value={formatCents(data.avgOrderValueCents)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue by Month */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Order Revenue by Month
          </h2>
          {data.revenueByMonth.length === 0 ? (
            <p className="text-sm text-[var(--color-ink-tertiary)]">No revenue data yet</p>
          ) : (
            <div className="space-y-1.5">
              {data.revenueByMonth.map(([month, cents]) => {
                const max = Math.max(...data.revenueByMonth.map(([, c]) => c), 1);
                return (
                  <div key={month} className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-ink-secondary)] w-16 text-right font-mono">{month}</span>
                    <div className="flex-1 h-5 bg-[var(--color-surface-sunken)] rounded overflow-hidden">
                      <div className="h-full bg-[var(--color-action)] rounded" style={{ width: `${(cents / max) * 100}%` }} />
                    </div>
                    <span className="text-xs text-[var(--color-ink-tertiary)] w-16 text-right">{formatCents(cents)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Free First Roll Cost */}
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
            Customer Acquisition Cost
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">Free First Roll Orders</p>
              <p className="text-2xl font-medium">{data.freeFirstRollCount}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">Estimated Cost (production + shipping)</p>
              <p className="text-2xl font-medium">{formatCents(data.estimatedFreeRollCostCents)}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-tertiary)]">Cost per Acquisition</p>
              <p className="text-2xl font-medium">
                {data.freeFirstRollCount > 0
                  ? formatCents(Math.round(data.estimatedFreeRollCostCents / data.freeFirstRollCount))
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
