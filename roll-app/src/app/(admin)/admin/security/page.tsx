'use client';

import { useEffect, useState, useCallback } from 'react';

interface AuditEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

interface AuditData {
  entries: AuditEntry[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminSecurityPage() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (actionFilter) params.set('action', actionFilter);
      const res = await fetch(`/api/admin/audit-log?${params}`);
      if (res.ok) setData(await res.json());
    } catch { /* silent */ } finally { setLoading(false); }
  }, [page, actionFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Security & Audit Log</h1>

      {/* Filter */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by action..."
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] w-64"
        />
      </div>

      {/* Audit Log */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-ink-tertiary)]">Loading...</div>
        ) : !data || data.entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-ink-tertiary)]">
            No audit log entries yet. Admin actions will appear here.
          </div>
        ) : (
          <div className="divide-y divide-[var(--color-border)]">
            {data.entries.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--color-action)]">{entry.action}</span>
                    {entry.target_type && (
                      <span className="text-xs text-[var(--color-ink-tertiary)]">
                        on {entry.target_type}
                        {entry.target_id && (
                          <a
                            href={`/admin/${entry.target_type}s/${entry.target_id}`}
                            className="ml-1 text-[var(--color-action)] hover:underline"
                          >
                            {entry.target_id.slice(0, 8)}...
                          </a>
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-ink-tertiary)]">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                </div>
                {Object.keys(entry.metadata).length > 0 && (
                  <pre className="text-xs text-[var(--color-ink-tertiary)] font-mono mt-1 overflow-x-auto">
                    {JSON.stringify(entry.metadata, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sharp)] disabled:opacity-30 hover:bg-[var(--color-surface-raised)]"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-ink-secondary)]">
            Page {page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(data.totalPages, page + 1))}
            disabled={page === data.totalPages}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sharp)] disabled:opacity-30 hover:bg-[var(--color-surface-raised)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
