'use client';

import { useEffect, useState, useCallback } from 'react';
import { Printer, ExternalLink, RotateCcw, CheckSquare, Square } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { useToast } from '@/stores/toastStore';
import type { PrintOrder, PrintOrderStatus } from '@/types/print';
import type { Roll } from '@/types/roll';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

function statusBadgeVariant(
  status: PrintOrderStatus
): 'processing' | 'action' | 'developed' | 'error' {
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

interface OrderWithRoll extends PrintOrder {
  roll_name?: string | null;
}

export default function OrderHistoryPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [orders, setOrders] = useState<OrderWithRoll[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-roll print selection
  const [developedRolls, setDevelopedRolls] = useState<Roll[]>([]);
  const [rollsLoading, setRollsLoading] = useState(false);
  const [selectedRollIds, setSelectedRollIds] = useState<Set<string>>(new Set());
  const [showPrintSelector, setShowPrintSelector] = useState(false);

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

  // Fetch developed rolls for multi-select print
  useEffect(() => {
    if (!showPrintSelector) return;
    async function fetchRolls() {
      setRollsLoading(true);
      try {
        const res = await fetch('/api/rolls');
        if (res.ok) {
          const { data } = await res.json();
          const developed = (data ?? []).filter((r: Roll) => r.status === 'developed');
          setDevelopedRolls(developed);
        }
      } catch {
        // Non-critical
      } finally {
        setRollsLoading(false);
      }
    }
    fetchRolls();
  }, [showPrintSelector]);

  const toggleRollSelection = useCallback((rollId: string) => {
    setSelectedRollIds((prev) => {
      const next = new Set(prev);
      if (next.has(rollId)) next.delete(rollId);
      else next.add(rollId);
      return next;
    });
  }, []);

  const handleReorder = useCallback(
    (order: OrderWithRoll) => {
      if (order.roll_id) {
        router.push(`/roll/${order.roll_id}/order`);
      }
    },
    [router]
  );

  const handlePrintSelected = useCallback(() => {
    if (selectedRollIds.size === 0) return;
    // Navigate to order page with first roll, passing all roll IDs
    const rollIds = Array.from(selectedRollIds);
    const params = new URLSearchParams();
    rollIds.forEach((id) => params.append('rollId', id));
    router.push(`/roll/${rollIds[0]}/order?${params.toString()}`);
  }, [selectedRollIds, router]);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-element)]">
          <BackButton href="/account" label="Back to account" />
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            Print Orders
          </h1>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowPrintSelector(!showPrintSelector)}
        >
          <Printer size={14} className="mr-1" />
          {showPrintSelector ? 'Cancel' : 'Print Rolls'}
        </Button>
      </div>

      {/* Multi-roll print selector */}
      {showPrintSelector && (
        <Card>
          <div className="flex flex-col gap-[var(--space-component)]">
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                Select rolls to print
              </h2>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Choose one or more developed rolls to order prints for
              </p>
            </div>

            {rollsLoading && (
              <div className="flex items-center justify-center py-[var(--space-component)]">
                <Spinner size="sm" />
              </div>
            )}

            {!rollsLoading && developedRolls.length === 0 && (
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-component)]">
                No developed rolls available. Develop a roll first to order prints.
              </p>
            )}

            {!rollsLoading && developedRolls.length > 0 && (
              <div className="flex flex-col gap-[var(--space-tight)]">
                {developedRolls.map((roll) => (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => toggleRollSelection(roll.id)}
                    className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border transition-colors ${
                      selectedRollIds.has(roll.id)
                        ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-ink-tertiary)]'
                    }`}
                  >
                    {selectedRollIds.has(roll.id) ? (
                      <CheckSquare size={20} className="text-[var(--color-action)] shrink-0" />
                    ) : (
                      <Square size={20} className="text-[var(--color-ink-tertiary)] shrink-0" />
                    )}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
                        {roll.name || 'Untitled Roll'}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {roll.photo_count} photos
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {selectedRollIds.size > 0 && (
              <Button variant="primary" size="lg" onClick={handlePrintSelected}>
                <Printer size={16} className="mr-2" />
                Print {selectedRollIds.size} Roll{selectedRollIds.size > 1 ? 's' : ''} (
                {developedRolls
                  .filter((r) => selectedRollIds.has(r.id))
                  .reduce((sum, r) => sum + r.photo_count, 0)}{' '}
                photos)
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Empty state */}
      {orders.length === 0 && !showPrintSelector && (
        <Empty
          icon={Printer}
          title="No print orders yet"
          description="Develop a roll and order your first prints!"
          action={
            <Link href="/library">
              <Button variant="secondary">Go to Gallery</Button>
            </Link>
          }
        />
      )}

      {/* Order list */}
      {orders.length > 0 && (
        <div className="flex flex-col gap-[var(--space-element)]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink-secondary)]">
            Order History
          </h2>
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

                {/* Actions row */}
                <div className="flex items-center gap-[var(--space-element)]">
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

                  {/* Reorder button */}
                  {order.roll_id &&
                    (order.status === 'delivered' || order.status === 'simulated') && (
                      <button
                        type="button"
                        onClick={() => handleReorder(order)}
                        className="inline-flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium text-[var(--color-ink-secondary)] hover:text-[var(--color-action)] transition-colors"
                      >
                        <RotateCcw size={12} />
                        Reorder
                      </button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
