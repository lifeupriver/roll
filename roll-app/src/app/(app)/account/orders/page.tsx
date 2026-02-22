'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Printer, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { useToast } from '@/stores/toastStore';
import type { PrintOrder, PrintOrderStatus } from '@/types/print';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Status mapping to Badge variants
// ---------------------------------------------------------------------------
function statusBadgeVariant(status: PrintOrderStatus): 'processing' | 'action' | 'developed' | 'error' {
  switch (status) {
    case 'pending':
    case 'submitted':
    case 'in_production':
    case 'simulated':
      return 'processing';
    case 'shipped':
      return 'action';
    case 'delivered':
      return 'developed';
    case 'cancelled':
      return 'error';
    default:
      return 'processing';
  }
}

function statusLabel(status: PrintOrderStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'submitted':
      return 'Submitted';
    case 'in_production':
      return 'In Production';
    case 'shipped':
      return 'Shipped';
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'simulated':
      return 'Simulated';
    default:
      return status;
  }
}

// ---------------------------------------------------------------------------
// Extend PrintOrder with optional roll name from the API response
// ---------------------------------------------------------------------------
interface OrderWithRoll extends PrintOrder {
  roll_name?: string | null;
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------
export default function OrderHistoryPage() {
  const { toast } = useToast();

  const [orders, setOrders] = useState<OrderWithRoll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to load orders');
        }
        const { data } = await res.json();
        setOrders(data ?? []);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Failed to load orders', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [toast]);

  // ---- Loading state ------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <Link
          href="/account"
          className="flex items-center justify-center w-10 h-10 rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors duration-150 text-[var(--color-ink)]"
          aria-label="Back to account"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
          Print Orders
        </h1>
      </div>

      {/* Empty state */}
      {orders.length === 0 && (
        <Empty
          icon={Printer}
          title="No print orders yet"
          description="Develop a roll and order your first prints!"
          action={
            <Link href="/library">
              <Button variant="secondary">Go to Library</Button>
            </Link>
          }
        />
      )}

      {/* Order list */}
      {orders.length > 0 && (
        <div className="flex flex-col gap-[var(--space-element)]">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-col gap-[var(--space-element)]">
                {/* Top row: date + status badge */}
                <div className="flex items-center justify-between">
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-[0.02em]">
                    {new Date(order.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <Badge variant={statusBadgeVariant(order.status)}>
                    {statusLabel(order.status)}
                  </Badge>
                </div>

                {/* Order details */}
                <div className="flex flex-col gap-[var(--space-tight)]">
                  <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                    {order.roll_name || 'Untitled Roll'}
                  </p>
                  <div className="flex items-center gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                    <span>
                      {order.photo_count} photo{order.photo_count !== 1 ? 's' : ''}
                    </span>
                    <span className="text-[var(--color-border)]">|</span>
                    <span className="font-[family-name:var(--font-mono)]">{order.print_size}</span>
                    <span className="text-[var(--color-border)]">|</span>
                    <span>
                      {order.is_free_first_roll
                        ? 'Free'
                        : order.total_cents != null
                          ? `$${(order.total_cents / 100).toFixed(2)}`
                          : '--'}
                    </span>
                  </div>
                </div>

                {/* Tracking link */}
                {order.tracking_url && (
                  <a
                    href={order.tracking_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium text-[var(--color-action)] hover:underline"
                  >
                    Track Package
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
