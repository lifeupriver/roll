'use client';

import { useEffect, useState, useCallback } from 'react';
import { InsightCard } from '@/components/admin/InsightCard';

interface Insight {
  id: string;
  type: string;
  severity: string;
  section: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  acknowledged: boolean;
  created_at: string;
}

interface AnalysisRun {
  id: string;
  type: string;
  status: string;
  insights_generated: number;
  tokens_used: number;
  cost_cents: number;
  created_at: string;
  completed_at: string | null;
}

interface InsightsData {
  insights: Insight[];
  recentRuns: AnalysisRun[];
}

export default function AdminInsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [sectionFilter, setSectionFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [showAcknowledged, setShowAcknowledged] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (sectionFilter) params.set('section', sectionFilter);
      if (severityFilter) params.set('severity', severityFilter);
      if (!showAcknowledged) params.set('acknowledged', 'false');
      const res = await fetch(`/api/admin/insights?${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [sectionFilter, severityFilter, showAcknowledged]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const triggerAnalysis = async (type: string) => {
    setRunning(true);
    try {
      const res = await fetch('/api/admin/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        // Refresh data after analysis
        await fetchData();
      }
    } catch {
      /* silent */
    } finally {
      setRunning(false);
    }
  };

  const acknowledgeInsight = async (id: string) => {
    try {
      await fetch('/api/admin/insights', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, acknowledged: true }),
      });
      setData((prev) =>
        prev
          ? {
              ...prev,
              insights: prev.insights.map((i) => (i.id === id ? { ...i, acknowledged: true } : i)),
            }
          : prev
      );
    } catch {
      /* silent */
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">AI Insights</h1>
        <div className="flex gap-2">
          <button
            onClick={() => triggerAnalysis('daily_briefing')}
            disabled={running}
            className="px-3 py-1.5 text-xs bg-[var(--color-action)] text-white rounded-[var(--radius-sharp)] hover:bg-[var(--color-action-hover)] disabled:opacity-50 transition-colors"
          >
            {running ? 'Analyzing...' : 'Run Daily Briefing'}
          </button>
          <button
            onClick={() => triggerAnalysis('weekly_deep_dive')}
            disabled={running}
            className="px-3 py-1.5 text-xs bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-sunken)] disabled:opacity-50 transition-colors"
          >
            Weekly Deep Dive
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)]"
        >
          <option value="">All Sections</option>
          {['home', 'users', 'photos', 'rolls', 'orders', 'circles', 'pipeline', 'growth'].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)]"
        >
          <option value="">All Severities</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="info">Info</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-secondary)]">
          <input
            type="checkbox"
            checked={showAcknowledged}
            onChange={(e) => setShowAcknowledged(e.target.checked)}
            className="rounded"
          />
          Show acknowledged
        </label>
      </div>

      {/* Insights Feed */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse"
            />
          ))}
        </div>
      ) : !data || data.insights.length === 0 ? (
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-12 text-center">
          <div className="text-3xl mb-3 opacity-30">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="mx-auto"
            >
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-ink-tertiary)]">No insights yet</p>
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
            Click &quot;Run Daily Briefing&quot; to generate AI-powered insights about your app
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.insights
            .filter((i) => showAcknowledged || !i.acknowledged)
            .map((insight) => (
              <InsightCard key={insight.id} insight={insight} onAcknowledge={acknowledgeInsight} />
            ))}
        </div>
      )}

      {/* Recent Analysis Runs */}
      {data && data.recentRuns.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Recent Analysis Runs
          </h2>
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {data.recentRuns.map((run) => (
              <div key={run.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm">{run.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)]">
                    {run.insights_generated} insights · {run.tokens_used.toLocaleString()} tokens ·
                    ${(run.cost_cents / 100).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-xs ${run.status === 'completed' ? 'text-emerald-400' : run.status === 'failed' ? 'text-red-400' : 'text-yellow-400'}`}
                  >
                    {run.status}
                  </span>
                  <p className="text-[11px] text-[var(--color-ink-tertiary)]">
                    {new Date(run.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
