'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StatusBadge } from '@/components/admin/StatusBadge';

interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  tier: string;
  role: string;
  photo_count: number;
  storage_used_bytes: number;
  onboarding_complete: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

interface Roll {
  id: string;
  name: string | null;
  status: string;
  film_profile: string | null;
  photo_count: number;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: string;
  product: string;
  print_size: string;
  status: string;
  total_cents: number | null;
  created_at: string;
}

interface Note {
  id: string;
  body: string;
  admin_id: string;
  created_at: string;
}

interface UserData {
  profile: Profile;
  rolls: Roll[];
  orders: Order[];
  favoritesCount: number;
  circles: Array<{ circle_id: string; circles: { id: string; name: string; member_count: number } | null }>;
  notes: Note[];
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatCents(cents: number | null): string {
  if (cents === null || cents === undefined) return '—';
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const updateTier = async (newTier: string) => {
    if (!data || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: newTier }),
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => prev ? { ...prev, profile: json.profile } : prev);
      }
    } catch {
      // silent
    } finally {
      setUpdating(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <button onClick={() => router.back()} className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]">
          &larr; Back to users
        </button>
        <div className="h-48 bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] skeleton-pulse" />
      </div>
    );
  }

  const { profile, rolls, orders, favoritesCount, circles, notes } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => router.push('/admin/users')} className="text-sm text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]">
        &larr; Back to users
      </button>

      {/* Profile Header */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center text-lg font-medium text-[var(--color-action)]">
                {profile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="font-[family-name:var(--font-display)] text-lg font-medium">
                  {profile.display_name || profile.email}
                </h1>
                {profile.display_name && (
                  <p className="text-sm text-[var(--color-ink-tertiary)]">{profile.email}</p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge status={profile.tier} />
              {profile.role === 'admin' && <StatusBadge status="admin" />}
              {!profile.onboarding_complete && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium uppercase tracking-[0.04em] border bg-orange-500/10 text-orange-400 border-orange-500/20">
                  onboarding incomplete
                </span>
              )}
            </div>
          </div>

          {/* Tier Actions */}
          <div className="flex gap-2">
            {profile.tier === 'free' ? (
              <button
                onClick={() => updateTier('plus')}
                disabled={updating}
                className="px-3 py-1.5 text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-[var(--radius-sharp)] hover:bg-amber-500/20 disabled:opacity-50"
              >
                Upgrade to Plus
              </button>
            ) : (
              <button
                onClick={() => updateTier('free')}
                disabled={updating}
                className="px-3 py-1.5 text-xs bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded-[var(--radius-sharp)] hover:bg-gray-500/20 disabled:opacity-50"
              >
                Downgrade to Free
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-4 border-t border-[var(--color-border)]">
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Photos</p>
            <p className="text-lg font-medium">{profile.photo_count.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Storage</p>
            <p className="text-lg font-medium">{formatBytes(profile.storage_used_bytes)}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Rolls</p>
            <p className="text-lg font-medium">{rolls.length}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Orders</p>
            <p className="text-lg font-medium">{orders.length}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-ink-tertiary)] uppercase tracking-[0.06em]">Favorites</p>
            <p className="text-lg font-medium">{favoritesCount}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-[var(--color-border)] text-xs text-[var(--color-ink-tertiary)]">
          <div>
            <span className="uppercase tracking-[0.06em]">ID</span>
            <p className="font-mono text-[var(--color-ink-secondary)] mt-0.5 truncate">{profile.id}</p>
          </div>
          <div>
            <span className="uppercase tracking-[0.06em]">Joined</span>
            <p className="text-[var(--color-ink-secondary)] mt-0.5">{new Date(profile.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="uppercase tracking-[0.06em]">Stripe Customer</span>
            <p className="text-[var(--color-ink-secondary)] mt-0.5 truncate">{profile.stripe_customer_id || '—'}</p>
          </div>
          <div>
            <span className="uppercase tracking-[0.06em]">Referral Code</span>
            <p className="text-[var(--color-ink-secondary)] mt-0.5">{profile.referral_code || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Rolls */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Rolls ({rolls.length})
          </h2>
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {rolls.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-ink-tertiary)] text-center">No rolls</p>
            ) : (
              rolls.slice(0, 20).map((roll) => (
                <div key={roll.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{roll.name || 'Untitled'}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">
                      {roll.photo_count} photos {roll.film_profile ? `· ${roll.film_profile}` : ''}
                    </p>
                  </div>
                  <StatusBadge status={roll.status} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Orders */}
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Orders ({orders.length})
          </h2>
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {orders.length === 0 ? (
              <p className="p-4 text-sm text-[var(--color-ink-tertiary)] text-center">No orders</p>
            ) : (
              orders.slice(0, 20).map((order) => (
                <a
                  key={order.id}
                  href={`/admin/orders/${order.id}`}
                  className="px-4 py-2.5 flex items-center justify-between hover:bg-[var(--color-surface-sunken)] transition-colors block"
                >
                  <div>
                    <p className="text-sm">{order.product} · {order.print_size}</p>
                    <p className="text-xs text-[var(--color-ink-tertiary)]">
                      {formatCents(order.total_cents)} · {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </a>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Circles */}
      {circles.length > 0 && (
        <div>
          <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
            Circles ({circles.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {circles.map((cm) => (
              <span
                key={cm.circle_id}
                className="inline-flex items-center px-3 py-1.5 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-sm"
              >
                {cm.circles?.name ?? 'Unknown'} ({cm.circles?.member_count ?? 0})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Admin Notes */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-[var(--color-ink-tertiary)] mb-3">
          Admin Notes
        </h2>
        <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] border border-[var(--color-border)]">
          {notes.length === 0 ? (
            <p className="p-4 text-sm text-[var(--color-ink-tertiary)] text-center">No notes yet</p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {notes.map((note) => (
                <div key={note.id} className="p-4">
                  <p className="text-sm">{note.body}</p>
                  <p className="text-xs text-[var(--color-ink-tertiary)] mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
