'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, Column } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  role: string;
  photo_count: number;
  storage_used_bytes: number;
  onboarding_complete: boolean;
  created_at: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [tier, setTier] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
      });
      if (search) params.set('search', search);
      if (tier) params.set('tier', tier);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const json = await res.json();
        setUsers(json.users);
        setTotal(json.total);
        setTotalPages(json.totalPages);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [page, search, tier]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const columns: Column<User>[] = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium">{row.display_name || row.email}</p>
          {row.display_name && (
            <p className="text-xs text-[var(--color-ink-tertiary)]">{row.email}</p>
          )}
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (row) => <StatusBadge status={row.tier} />,
    },
    {
      key: 'photo_count',
      label: 'Photos',
      sortable: true,
      render: (row) => <span>{row.photo_count.toLocaleString()}</span>,
      className: 'text-right',
    },
    {
      key: 'storage_used_bytes',
      label: 'Storage',
      sortable: true,
      render: (row) => <span>{formatBytes(row.storage_used_bytes)}</span>,
      className: 'text-right',
    },
    {
      key: 'onboarding_complete',
      label: 'Onboarded',
      render: (row) => (
        <span className={row.onboarding_complete ? 'text-emerald-400' : 'text-[var(--color-ink-tertiary)]'}>
          {row.onboarding_complete ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Joined',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-[var(--color-ink-secondary)]">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Users</h1>
        <span className="text-sm text-[var(--color-ink-tertiary)]">{total.toLocaleString()} total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] w-64"
        />
        <select
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)]"
        >
          <option value="">All Tiers</option>
          <option value="free">Free</option>
          <option value="plus">Plus</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--color-ink-tertiary)]">Loading...</div>
        ) : (
          <DataTable
            columns={columns}
            data={users}
            keyField="id"
            onRowClick={(row) => router.push(`/admin/users/${row.id}`)}
          />
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sharp)] disabled:opacity-30 hover:bg-[var(--color-surface-raised)]"
          >
            Previous
          </button>
          <span className="text-sm text-[var(--color-ink-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-[var(--radius-sharp)] disabled:opacity-30 hover:bg-[var(--color-surface-raised)]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
