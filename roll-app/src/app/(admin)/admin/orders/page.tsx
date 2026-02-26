'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { StatCard } from '@/components/admin/StatCard';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface OrderData {
  total: number;
  statusBreakdown: Record<string, number>;
  totalRevenueCents: number;
  avgOrderValueCents: number;
  freeFirstRollCount: number;
  orders: Array<{
    id: string;
    user_id: string;
    product: string;
    print_size: string;
    photo_count: number;
    status: string;
    total_cents: number | null;
    is_free_first_roll: boolean;
    shipping_name: string;
    created_at: string;
  }>;
  page: number;
  totalPages: number;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/admin/orders${params}`);
      if (res.ok) setData(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Orders</h1>
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

  const ORDER_PIPELINE = ['pending', 'submitted', 'in_production', 'shipped', 'delivered'];

  return (
    <div className="space-y-8">
      <h1 className="font-[family-name:var(--font-display)] text-xl font-medium">Orders</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Orders" value={data.total} />
        <StatCard label="Total Revenue" value={formatCents(data.totalRevenueCents)} />
        <StatCard label="Avg Order Value" value={formatCents(data.avgOrderValueCents)} />
        <StatCard label="Free First Rolls" value={data.freeFirstRollCount} />
      </div>

      {/* Status Pipeline */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-4">
          Order Pipeline
        </h2>
        <div className="flex items-center gap-1">
          {ORDER_PIPELINE.map((status, i) => {
            const count = data.statusBreakdown[status] ?? 0;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
                className={`flex-1 text-center py-3 rounded-[var(--radius-sharp)] border transition-colors ${
                  statusFilter === status
                    ? 'bg-[var(--color-action-subtle)] border-[var(--color-action)]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-surface-sunken)]'
                }`}
              >
                <p className="text-lg font-medium">{count}</p>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)]">
                  {status.replace('_', ' ')}
                </p>
                {i < ORDER_PIPELINE.length - 1 && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-[var(--color-ink-tertiary)]" />
                )}
              </button>
            );
          })}
        </div>
        {(data.statusBreakdown['cancelled'] ?? 0) > 0 && (
          <p className="text-xs text-[var(--color-ink-tertiary)] mt-2">
            + {data.statusBreakdown['cancelled']} cancelled
          </p>
        )}
      </div>

      {/* Order List */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {data.orders.map((order) => (
          <button
            key={order.id}
            onClick={() => router.push(`/admin/orders/${order.id}`)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--color-surface-sunken)] transition-colors text-left"
          >
            <div className="min-w-0">
              <p className="text-sm">
                {order.product} · {order.print_size} · {order.photo_count} photos
                {order.is_free_first_roll && (
                  <span className="ml-1 text-[11px] text-amber-400">(Free first roll)</span>
                )}
              </p>
              <p className="text-xs text-[var(--color-ink-tertiary)]">
                {order.shipping_name} · {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
              <span className="text-sm font-medium">
                {order.total_cents ? formatCents(order.total_cents) : 'Free'}
              </span>
              <StatusBadge status={order.status} />
            </div>
          </button>
        ))}
        {data.orders.length === 0 && (
          <p className="p-8 text-center text-sm text-[var(--color-ink-tertiary)]">
            No orders found
          </p>
        )}
      </div>
    </div>
  );
}
