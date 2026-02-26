'use client';

import { useEffect, useState, useCallback } from 'react';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { InsightCard } from '@/components/admin/InsightCard';

interface Stats {
  users: { total: number; newToday: number; newThisWeek: number; plusSubscribers: number };
  photos: { total: number; uploadedToday: number };
  rolls: { statusBreakdown: Record<string, number>; total: number };
  orders: { total: number; pending: number };
  pipeline: { pendingJobs: number };
  storage: { totalBytes: number };
}

interface Insight {
  id: string;
  type: string;
  severity: string;
  section: string;
  title: string;
  body: string;
  acknowledged: boolean;
  created_at: string;
}

interface RecentSignup {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  created_at: string;
}

interface RecentRoll {
  id: string;
  name: string | null;
  status: string;
  film_profile: string | null;
  user_id: string;
  updated_at: string;
}

interface DashboardData {
  stats: Stats;
  recentSignups: RecentSignup[];
  recentActivity: RecentRoll[];
  insights: Insight[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function AdminHomeDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — will retry
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 h-24 skeleton-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const { stats, recentSignups, recentActivity, insights } = data;
  const totalRolls = Object.values(stats.rolls.statusBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Dashboard</h1>
        <span className="text-xs text-[var(--color-ink-tertiary)]">Auto-refreshes every 30s</span>
      </div>

      {/* Vital Signs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Users"
          value={stats.users.total}
          change={stats.users.newToday > 0 ? stats.users.newToday : undefined}
          changeLabel="new today"
        />
        <StatCard label="Plus Subscribers" value={stats.users.plusSubscribers} />
        <StatCard
          label="Total Photos"
          value={stats.photos.total}
          change={stats.photos.uploadedToday > 0 ? stats.photos.uploadedToday : undefined}
          changeLabel="today"
        />
        <StatCard label="Total Rolls" value={totalRolls} />
        <StatCard
          label="Active Orders"
          value={stats.orders.pending}
          changeLabel={`of ${stats.orders.total} total`}
        />
        <StatCard
          label="Queue Depth"
          value={stats.pipeline.pendingJobs}
          changeLabel="pending jobs"
        />
        <StatCard label="Storage Used" value={formatBytes(stats.storage.totalBytes)} />
        <StatCard label="New This Week" value={stats.users.newThisWeek} changeLabel="signups" />
      </div>

      {/* Roll Status Breakdown */}
      {Object.keys(stats.rolls.statusBreakdown).length > 0 && (
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Roll Status Breakdown
          </h2>
          <div className="flex flex-wrap gap-4">
            {Object.entries(stats.rolls.statusBreakdown).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2">
                <StatusBadge status={status} />
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            AI Insights
          </h2>
          {insights.length === 0 ? (
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6 text-center">
              <p className="text-sm text-[var(--color-ink-tertiary)]">No pending insights</p>
              <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
                AI analysis will appear here once configured
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Signups */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Recent Signups
          </h2>
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {recentSignups.map((user) => (
              <a
                key={user.id}
                href={`/admin/users/${user.id}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--color-surface-sunken)] transition-colors first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)]"
              >
                <div className="min-w-0">
                  <p className="text-sm truncate">{user.display_name || user.email}</p>
                  {user.display_name && (
                    <p className="text-xs text-[var(--color-ink-tertiary)] truncate">
                      {user.email}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <StatusBadge status={user.tier} />
                  <span className="text-[11px] text-[var(--color-ink-tertiary)]">
                    {timeAgo(user.created_at)}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Roll Activity */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Recent Roll Activity
        </h2>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {recentActivity.map((roll) => (
            <a
              key={roll.id}
              href={`/admin/rolls/${roll.id}`}
              className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--color-surface-sunken)] transition-colors first:rounded-t-[var(--radius-card)] last:rounded-b-[var(--radius-card)]"
            >
              <div className="min-w-0">
                <p className="text-sm truncate">{roll.name || 'Untitled Roll'}</p>
                {roll.film_profile && (
                  <p className="text-xs text-[var(--color-ink-tertiary)]">{roll.film_profile}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                <StatusBadge status={roll.status} />
                <span className="text-[11px] text-[var(--color-ink-tertiary)]">
                  {timeAgo(roll.updated_at)}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
