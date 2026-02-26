'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface Order {
  id: string;
  user_id: string;
  roll_id: string | null;
  product: string;
  print_size: string;
  photo_count: number;
  is_free_first_roll: boolean;
  shipping_name: string;
  shipping_line1: string;
  shipping_line2: string | null;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  prodigi_order_id: string | null;
  status: string;
  tracking_url: string | null;
  subtotal_cents: number | null;
  shipping_cents: number | null;
  total_cents: number | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  id: string;
  photo_id: string;
  processed_storage_key: string;
  position: number;
}

function formatCents(cents: number | null): string {
  if (cents === null) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order);
        setItems(data.items);
      }
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  if (loading || !order) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
        >
          &larr; Back
        </button>
        <div className="h-64 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/admin/orders')}
        className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]"
      >
        &larr; Back to orders
      </button>

      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-[family-name:var(--font-display)] text-lg font-medium">
            Order {order.id.slice(0, 8)}...
          </h1>
          <StatusBadge status={order.status} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Product</p>
            <p className="text-sm font-medium">{order.product}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Print Size</p>
            <p className="text-sm font-medium">{order.print_size}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Photos</p>
            <p className="text-sm font-medium">{order.photo_count}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase">Total</p>
            <p className="text-sm font-medium">{formatCents(order.total_cents)}</p>
          </div>
        </div>

        {order.is_free_first_roll && (
          <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-[var(--radius-sharp)] text-xs text-amber-400">
            Free first roll order
          </div>
        )}

        {/* Pricing */}
        <div className="border-t border-[var(--color-border)] pt-4 mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-ink-tertiary)]">Subtotal</span>
            <span>{formatCents(order.subtotal_cents)}</span>
          </div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-[var(--color-ink-tertiary)]">Shipping</span>
            <span>{formatCents(order.shipping_cents)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium pt-1 border-t border-[var(--color-border)]">
            <span>Total</span>
            <span>{formatCents(order.total_cents)}</span>
          </div>
        </div>

        {/* Shipping */}
        <div className="border-t border-[var(--color-border)] pt-4 mb-4">
          <h3 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-2">
            Shipping
          </h3>
          <p className="text-sm">{order.shipping_name}</p>
          <p className="text-sm text-[var(--color-ink-secondary)]">{order.shipping_line1}</p>
          {order.shipping_line2 && (
            <p className="text-sm text-[var(--color-ink-secondary)]">{order.shipping_line2}</p>
          )}
          <p className="text-sm text-[var(--color-ink-secondary)]">
            {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}
          </p>
          <p className="text-sm text-[var(--color-ink-secondary)]">{order.shipping_country}</p>
        </div>

        {/* IDs & Tracking */}
        <div className="border-t border-[var(--color-border)] pt-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-[var(--color-ink-tertiary)] uppercase">User</span>
            <a
              href={`/admin/users/${order.user_id}`}
              className="block text-[var(--color-action)] hover:underline mt-0.5"
            >
              {order.user_id.slice(0, 8)}...
            </a>
          </div>
          <div>
            <span className="text-[var(--color-ink-tertiary)] uppercase">Prodigi ID</span>
            <p className="text-[var(--color-ink-secondary)] mt-0.5">
              {order.prodigi_order_id || '—'}
            </p>
          </div>
          <div>
            <span className="text-[var(--color-ink-tertiary)] uppercase">Created</span>
            <p className="text-[var(--color-ink-secondary)] mt-0.5">
              {new Date(order.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[var(--color-ink-tertiary)] uppercase">Tracking</span>
            {order.tracking_url ? (
              <a
                href={order.tracking_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[var(--color-action)] hover:underline mt-0.5"
              >
                Track package
              </a>
            ) : (
              <p className="text-[var(--color-ink-secondary)] mt-0.5">—</p>
            )}
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Items ({items.length})
        </h2>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {items.map((item) => (
            <div key={item.id} className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-sm">Photo #{item.position + 1}</span>
              <span className="text-xs text-[var(--color-ink-tertiary)] font-mono truncate ml-3">
                {item.processed_storage_key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
