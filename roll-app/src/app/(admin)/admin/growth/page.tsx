'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';

interface GrowthData {
  funnel: Array<{ step: string; count: number }>;
  referrals: { total: number; signedUp: number; converted: number };
}

export default function AdminGrowthPage() {
  const [data, setData] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/growth');
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Growth & Funnels</h1>
        <div className="h-64 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse" />
      </div>
    );
  }

  const maxCount = data.funnel[0]?.count || 1;

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Growth & Funnels</h1>

      {/* Activation Funnel */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-6">
          Activation Funnel
        </h2>
        <div className="space-y-3">
          {data.funnel.map((step, i) => {
            const prevCount = i > 0 ? data.funnel[i - 1].count : step.count;
            const conversionRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : '—';
            const overallRate = maxCount > 0 ? ((step.count / maxCount) * 100).toFixed(1) : '0';
            const barWidth = maxCount > 0 ? (step.count / maxCount) * 100 : 0;

            return (
              <div key={step.step}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">{step.step}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{step.count.toLocaleString()}</span>
                    {i > 0 && (
                      <span className="text-xs text-[var(--color-ink-tertiary)] w-16 text-right">
                        {conversionRate}% step
                      </span>
                    )}
                    <span className="text-xs text-[var(--color-ink-tertiary)] w-16 text-right">
                      {overallRate}% total
                    </span>
                  </div>
                </div>
                <div className="h-6 bg-[var(--color-surface-sunken)] rounded overflow-hidden">
                  <div
                    className="h-full bg-[var(--color-action)] rounded transition-all"
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Referral Stats */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Referral Program
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <StatCard label="Referrals Sent" value={data.referrals.total} />
          <StatCard label="Signed Up" value={data.referrals.signedUp} />
          <StatCard
            label="Converted"
            value={data.referrals.converted}
            changeLabel={
              data.referrals.total > 0
                ? `${((data.referrals.converted / data.referrals.total) * 100).toFixed(1)}% rate`
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}
