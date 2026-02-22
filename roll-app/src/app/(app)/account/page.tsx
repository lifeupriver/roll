'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { useToast } from '@/stores/toastStore';
import { EyeOff, Undo2, Package, ExternalLink, CreditCard } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { PrintOrder } from '@/types/print';

export default function AccountPage() {
  const { user, loading: userLoading } = useUser();
  const { logout, loading: logoutLoading } = useAuth();
  const { toast } = useToast();
  const [showFiltered, setShowFiltered] = useState(false);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);

  // Fetch print orders
  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const json = await res.json();
          setOrders(json.data ?? []);
        }
      } catch {
        // Non-critical
      } finally {
        setOrdersLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.data?.url) {
        track({ event: 'upgrade_started' });
        window.location.href = json.data.url;
      } else {
        toast(json.error || 'Failed to start checkout', 'error');
      }
    } catch {
      toast('Failed to start checkout', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (json.data?.url) {
        track({ event: 'billing_portal_opened' });
        window.location.href = json.data.url;
      } else {
        toast(json.error || 'Failed to open billing portal', 'error');
      }
    } catch {
      toast('Failed to open billing portal', 'error');
    } finally {
      setBillingLoading(false);
    }
  };

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
        Account
      </h1>

      {/* Profile Section */}
      <Card>
        <div className="flex items-center gap-[var(--space-component)]">
          <div className="w-12 h-12 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] flex items-center justify-center">
            <span className="font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-heading)] text-[var(--color-ink-tertiary)]">
              {user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <div>
            <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              {user?.display_name || 'No display name'}
            </p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {user?.email}
            </p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Subscription Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            <Badge variant={user?.tier === 'plus' ? 'action' : 'processing'}>
              {user?.tier === 'plus' ? 'Roll+' : 'Free'}
            </Badge>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {user?.tier === 'plus' ? 'All film profiles unlocked' : '1 film profile (Warmth)'}
            </span>
          </div>
          {user?.tier === 'plus' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleManageBilling}
              isLoading={billingLoading}
            >
              <CreditCard size={14} className="mr-1" />
              Manage
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleUpgrade}
              isLoading={billingLoading}
            >
              Upgrade
            </Button>
          )}
        </div>

        {user?.tier !== 'plus' && (
          <p className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            $4.99/month — all film profiles, unlimited processing, Circles, and more.
          </p>
        )}

        {/* Feature comparison */}
        <div className="mt-[var(--space-component)] border-t border-[var(--color-border)] pt-[var(--space-component)]">
          <div className="grid grid-cols-2 gap-[var(--space-tight)] text-[length:var(--text-caption)]">
            <div className="text-[var(--color-ink-secondary)]">Film profiles</div>
            <div className="text-[var(--color-ink)]">{user?.tier === 'plus' ? 'All 6' : 'Warmth only'}</div>
            <div className="text-[var(--color-ink-secondary)]">Circle sharing</div>
            <div className="text-[var(--color-ink)]">{user?.tier === 'plus' ? 'Create & share' : 'View only'}</div>
            <div className="text-[var(--color-ink-secondary)]">Print sizes</div>
            <div className="text-[var(--color-ink)]">{user?.tier === 'plus' ? '4×6 and 5×7' : '4×6 only'}</div>
          </div>
        </div>
      </Card>

      {/* Storage Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Storage
        </h2>
        <div className="flex items-center gap-[var(--space-element)]">
          <div className="flex-1 h-2 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] overflow-hidden">
            <div
              className="h-full bg-[var(--color-action)] rounded-[var(--radius-pill)] transition-all duration-300"
              style={{ width: `${Math.min(((user?.photo_count || 0) / 100) * 100, 100)}%` }}
            />
          </div>
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] whitespace-nowrap">
            {user?.photo_count || 0} {user?.tier === 'plus' ? 'photos' : '/ 100 photos'}
          </span>
        </div>
        <p className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          {user?.tier === 'plus' ? 'Unlimited storage' : 'Free tier: 100 photo limit'}
        </p>
      </Card>

      {/* Print History Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Print History
        </h2>
        {ordersLoading && (
          <div className="flex items-center justify-center py-[var(--space-component)]">
            <Spinner size="sm" />
          </div>
        )}
        {!ordersLoading && orders.length === 0 && (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            No print orders yet. Develop a roll and order your first prints!
          </p>
        )}
        {!ordersLoading && orders.length > 0 && (
          <div className="flex flex-col gap-[var(--space-element)]">
            {orders.map((order) => {
              const statusVariant: Record<string, 'processing' | 'action' | 'developed'> = {
                pending: 'processing',
                submitted: 'processing',
                in_production: 'processing',
                shipped: 'action',
                delivered: 'developed',
                simulated: 'processing',
              };
              return (
                <div
                  key={order.id}
                  className="flex items-center justify-between py-[var(--space-tight)] border-b border-[var(--color-border)] last:border-b-0"
                >
                  <div className="flex flex-col gap-[var(--space-micro)]">
                    <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {order.photo_count} photos · {order.print_size}
                      {order.is_free_first_roll ? ' · Free first roll' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-[var(--space-element)]">
                    <Badge variant={statusVariant[order.status] ?? 'processing'}>
                      {order.status === 'in_production'
                        ? 'Printing'
                        : order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </Badge>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--color-action)] hover:underline"
                      >
                        <ExternalLink size={16} />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Filtered Photos Section */}
      <Card>
        <button
          onClick={() => setShowFiltered(!showFiltered)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Filtered Photos
          </h2>
          <EyeOff size={20} className="text-[var(--color-ink-tertiary)]" />
        </button>
        {showFiltered && (
          <div className="mt-[var(--space-component)]">
            <Empty
              icon={Undo2}
              title="No filtered photos"
              description="Auto-filtered and manually hidden photos will appear here for recovery."
            />
          </div>
        )}
      </Card>

      {/* Sign Out */}
      <Button
        variant="ghost"
        onClick={logout}
        isLoading={logoutLoading}
        className="self-start text-[var(--color-action)]"
      >
        Sign Out
      </Button>
    </div>
  );
}
