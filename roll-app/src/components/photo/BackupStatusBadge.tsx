'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface BackupStats {
  backed_up_count: number;
  total_bytes: number;
  last_backup_at: string | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function BackupStatusBadge({ className }: { className?: string }) {
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/backup/status');
        if (res.ok) {
          const json = await res.json();
          setStats(json.data);
        }
      } catch {
        // Non-critical
      }
    }
    fetchStats();
  }, []);

  if (!stats || stats.backed_up_count === 0) return null;

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setShowDetail(!showDetail)}
        className="flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] bg-[var(--color-developed)]/10 text-[var(--color-developed)] transition-colors hover:bg-[var(--color-developed)]/20"
      >
        <ShieldCheck size={14} strokeWidth={2} />
        <span className="text-[length:var(--text-caption)] font-medium">
          {stats.backed_up_count} photos backed up
        </span>
      </button>

      {showDetail && (
        <div className="absolute top-full mt-[var(--space-tight)] right-0 z-20 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] shadow-[var(--shadow-floating)] p-[var(--space-component)] min-w-[220px] border border-[var(--color-border)]">
          <div className="flex flex-col gap-[var(--space-tight)]">
            <div className="flex items-center gap-[var(--space-tight)]">
              <ShieldCheck size={16} className="text-[var(--color-developed)]" />
              <span className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                Cloud Backup
              </span>
            </div>
            <div className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] flex flex-col gap-[var(--space-micro)]">
              <span>{stats.backed_up_count} photos safely stored</span>
              <span>{formatBytes(stats.total_bytes)} total</span>
              {stats.last_backup_at && (
                <span>
                  Last backup: {new Date(stats.last_backup_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
