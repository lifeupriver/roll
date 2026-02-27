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
import { Input } from '@/components/ui/Input';
import {
  EyeOff,
  Undo2,
  ExternalLink,
  CreditCard,
  Gift,
  Copy,
  Send,
  Bell,
  BellOff,
  CalendarHeart,
  ChevronRight,
  Layers,
  Clock,
  Search,
  MapPin,
  Moon,
  Sun,
  Info,
  Shield,
  Printer,
  Globe,
  Zap,
  BookOpen,
  Users,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { isValidEmail } from '@/types/auth';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useTheme } from '@/hooks/useTheme';
import { useStackStore } from '@/stores/stackStore';
import {
  loadAutomationSettings,
  saveAutomationSettings,
  type AutomationSettings,
} from '@/lib/automation/settings';
import { FILM_PROFILE_CONFIGS } from '@/lib/processing/filmProfiles';
import { FILM_PROFILES } from '@/types/roll';
import type { PrintOrder } from '@/types/print';
import type { ReferralStats } from '@/types/referral';

export default function AccountPage() {
  const { user, loading: userLoading } = useUser();
  const { logout, loading: logoutLoading } = useAuth();
  const { toast } = useToast();
  const [showFiltered, setShowFiltered] = useState(false);
  // Stack settings (persisted via store)
  const {
    mode: stackMode,
    sensitivity: stackSensitivity,
    setMode: setStackMode,
    setSensitivity: setStackSensitivity,
  } = useStackStore();
  const [showSensitivityInfo, setShowSensitivityInfo] = useState(false);
  const [orders, setOrders] = useState<PrintOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [referralEmail, setReferralEmail] = useState('');
  const [referralSending, setReferralSending] = useState(false);
  const {
    permission: pushPermission,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePushNotifications();
  const { theme, toggle: toggleTheme } = useTheme();

  // Automation settings
  const [automation, setAutomation] = useState<AutomationSettings>(loadAutomationSettings);
  const [circles, setCircles] = useState<{ id: string; name: string }[]>([]);

  const isFree = user?.tier === 'free';
  const freeProfileIds = new Set<string>(FILM_PROFILES.filter((p) => p.tier === 'free').map((p) => p.id));

  const updateAutomation = (updates: Partial<AutomationSettings>) => {
    const sanitized = { ...updates };
    if (isFree) {
      if (sanitized.defaultProcessMode && sanitized.defaultProcessMode !== 'color') {
        sanitized.defaultProcessMode = 'color';
      }
      if (sanitized.defaultFilmProfile && !freeProfileIds.has(sanitized.defaultFilmProfile)) {
        sanitized.defaultFilmProfile = 'warmth';
      }
    }
    setAutomation(saveAutomationSettings(sanitized));
  };

  // Fetch circles for auto-post dropdown
  useEffect(() => {
    async function fetchCircles() {
      try {
        const res = await fetch('/api/circles');
        if (res.ok) {
          const json = await res.json();
          setCircles(
            (json.data ?? []).map((c: { id: string; name: string }) => ({
              id: c.id,
              name: c.name,
            }))
          );
        }
      } catch {
        // Non-critical
      }
    }
    fetchCircles();
  }, []);

  // Fetch referral stats
  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch('/api/referrals');
        if (res.ok) {
          const json = await res.json();
          setReferralStats(json.data ?? null);
        }
      } catch {
        // Non-critical
      }
    }
    fetchReferrals();
  }, []);

  const handleReferralInvite = async () => {
    if (!isValidEmail(referralEmail)) {
      toast('Please enter a valid email address', 'error');
      return;
    }
    setReferralSending(true);
    try {
      const res = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: referralEmail }),
      });
      const json = await res.json();
      if (res.ok) {
        toast(`Invite sent to ${referralEmail}`, 'success');
        setReferralEmail('');
        // Refresh stats
        setReferralStats((prev) =>
          prev ? { ...prev, totalInvited: prev.totalInvited + 1 } : prev
        );
      } else {
        toast(json.error || 'Failed to send invite', 'error');
      }
    } catch {
      toast('Failed to send invite', 'error');
    } finally {
      setReferralSending(false);
    }
  };

  const handleCopyReferralLink = async () => {
    if (!referralStats?.referralCode) return;
    const link = `${window.location.origin}/auth/signup?ref=${referralStats.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      toast('Referral link copied!', 'success');
    } catch {
      toast('Failed to copy link', 'error');
    }
  };

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
              Member since{' '}
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* Darkroom Mode */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            {theme === 'darkroom' ? (
              <Moon size={18} className="text-[var(--color-action)]" />
            ) : (
              <Sun size={18} className="text-[var(--color-action)]" />
            )}
            <div>
              <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
                Darkroom Mode
              </h2>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                {theme === 'darkroom'
                  ? 'Deep charcoal with safelight accents'
                  : 'Light paper theme'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            role="switch"
            aria-checked={theme === 'darkroom'}
            aria-label="Darkroom mode"
            className={`relative w-12 h-7 rounded-[var(--radius-pill)] transition-colors duration-200 ${
              theme === 'darkroom' ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'
            }`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
                theme === 'darkroom' ? 'translate-x-[20px]' : 'translate-x-0'
              }`}
            >
              {theme === 'darkroom' ? (
                <Moon size={12} className="text-[var(--color-darkroom)]" />
              ) : (
                <Sun size={12} className="text-[var(--color-safelight)]" />
              )}
            </span>
          </button>
        </div>
      </Card>

      {/* Blog Management */}
      <Link href="/account/blog">
        <Card className="flex items-center justify-between cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
          <div className="flex items-center gap-[var(--space-element)]">
            <Globe size={20} className="text-[var(--color-action)]" />
            <div>
              <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                Blog
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Manage posts, settings, and subscribers
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--color-ink-tertiary)]" />
        </Card>
      </Link>

      {/* Subscription Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Subscription
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            <Badge variant={user?.tier === 'free' ? 'processing' : 'action'}>
              {user?.tier === 'pro' ? 'Roll Pro' : user?.tier === 'plus' ? 'Roll+' : 'Free'}
            </Badge>
            <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {user?.tier === 'pro'
                ? 'Business features + all profiles'
                : user?.tier === 'plus'
                  ? 'All film profiles unlocked'
                  : '1 film profile (Warmth)'}
            </span>
          </div>
          {user?.tier === 'plus' || user?.tier === 'pro' ? (
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
            <Button variant="primary" size="sm" onClick={handleUpgrade} isLoading={billingLoading}>
              Upgrade
            </Button>
          )}
        </div>

        {user?.tier === 'free' && (
          <p className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            $4.99/month — all film profiles, unlimited processing, Circles, and more.
          </p>
        )}

        {/* Feature comparison */}
        <div className="mt-[var(--space-component)] border-t border-[var(--color-border)] pt-[var(--space-component)]">
          <div className="grid grid-cols-2 gap-[var(--space-tight)] text-[length:var(--text-caption)]">
            <div className="text-[var(--color-ink-secondary)]">Film profiles</div>
            <div className="text-[var(--color-ink)]">
              {user?.tier === 'pro' || user?.tier === 'plus' ? 'All 6' : 'Warmth only'}
            </div>
            <div className="text-[var(--color-ink-secondary)]">Circle sharing</div>
            <div className="text-[var(--color-ink)]">
              {user?.tier === 'pro' || user?.tier === 'plus' ? 'Unlimited circles' : '1 circle'}
            </div>
            <div className="text-[var(--color-ink-secondary)]">Print sizes</div>
            <div className="text-[var(--color-ink)]">
              {user?.tier === 'pro' || user?.tier === 'plus' ? '4×6 and 5×7' : '4×6 only'}
            </div>
            <div className="text-[var(--color-ink-secondary)]">Public galleries</div>
            <div className="text-[var(--color-ink)]">
              {user?.tier === 'pro' ? 'Unlimited' : '—'}
            </div>
            <div className="text-[var(--color-ink-secondary)]">Business branding</div>
            <div className="text-[var(--color-ink)]">
              {user?.tier === 'pro' ? 'Custom logo & colors' : '—'}
            </div>
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

      {/* Stack Settings */}
      <Card>
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
          <Layers size={18} className="text-[var(--color-action)]" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Photo Stacking
          </h2>
        </div>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-component)]">
          Similar photos are grouped into stacks. The best photo is automatically chosen for your
          roll. Tap a stack to see all photos inside.
        </p>

        {/* Stack mode */}
        <div className="flex flex-col gap-[var(--space-element)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">
              Stacking mode
            </span>
            <div className="flex items-center gap-[var(--space-tight)]">
              {(['auto', 'manual', 'off'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setStackMode(mode)}
                  className={`px-2.5 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                    stackMode === mode
                      ? 'bg-[var(--color-action)] text-white'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]'
                  }`}
                >
                  {mode === 'auto' ? 'Auto' : mode === 'manual' ? 'Manual' : 'Off'}
                </button>
              ))}
            </div>
          </div>

          {/* Sensitivity slider (only when auto mode) */}
          {stackMode === 'auto' && (
            <div className="flex flex-col gap-[var(--space-tight)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-tight)]">
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                    Sensitivity
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSensitivityInfo(!showSensitivityInfo)}
                    className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors"
                    aria-label="What is sensitivity?"
                  >
                    <Info size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-[var(--space-element)]">
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Low
                  </span>
                  <input
                    type="range"
                    min={0.3}
                    max={1}
                    step={0.05}
                    value={stackSensitivity}
                    onChange={(e) => setStackSensitivity(Number(e.target.value))}
                    className="w-24 accent-[var(--color-action)]"
                  />
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    High
                  </span>
                </div>
              </div>
              {showSensitivityInfo && (
                <div className="bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] p-[var(--space-element)]">
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] leading-relaxed">
                    <strong>Low sensitivity</strong> only groups nearly identical photos (e.g. burst
                    shots of the same moment). <strong>High sensitivity</strong> groups photos that
                    are loosely similar (e.g. multiple shots from the same scene or angle). Adjust
                    to control how aggressively photos are grouped — the best photo from each stack
                    is automatically chosen for your roll.
                  </p>
                </div>
              )}
            </div>
          )}
          {stackMode === 'manual' && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              You choose which photos to group. Long-press a photo in the feed to create or add to a
              stack.
            </p>
          )}
          {stackMode === 'off' && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              All photos shown individually in the feed. No grouping.
            </p>
          )}
        </div>
      </Card>

      {/* Development Defaults */}
      <Card>
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
          <Palette size={18} className="text-[var(--color-action)]" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Development Defaults
          </h2>
        </div>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-component)]">
          Set your preferred color mode and film profile. These are pre-selected when you develop a roll.
        </p>

        {/* Default process mode */}
        <div className="flex flex-col gap-[var(--space-element)]">
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">Default mode</span>
            <div className="flex items-center gap-[var(--space-tight)]">
              {(['color', 'bw'] as const).filter((m) => !isFree || m === 'color').map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateAutomation({
                    defaultProcessMode: mode,
                    defaultFilmProfile: mode === 'color' ? 'warmth' : 'classic',
                  })}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                    automation.defaultProcessMode === mode
                      ? 'bg-[var(--color-action)] text-white'
                      : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]'
                  }`}
                >
                  {mode === 'color' ? <Sun size={12} /> : <Moon size={12} />}
                  {mode === 'color' ? 'Color' : 'B&W'}
                </button>
              ))}
            </div>
          </div>

          {/* Film profile selection */}
          <div className="flex items-center justify-between">
            <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">Film profile</span>
            <div className="flex items-center gap-[var(--space-tight)] flex-wrap justify-end">
              {Object.values(FILM_PROFILE_CONFIGS)
                .filter((p) => p.type === automation.defaultProcessMode)
                .filter((p) => !isFree || freeProfileIds.has(p.id))
                .map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => updateAutomation({ defaultFilmProfile: profile.id as AutomationSettings['defaultFilmProfile'] })}
                    className={`px-2.5 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                      automation.defaultFilmProfile === profile.id
                        ? 'bg-[var(--color-action)] text-white'
                        : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]'
                    }`}
                  >
                    {profile.name}
                  </button>
                ))}
            </div>
          </div>
          {user?.tier === 'free' && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              Upgrade to Roll+ to unlock all 6 film profiles.
            </p>
          )}
        </div>
      </Card>

      {/* Post-Develop Automations */}
      <Card>
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
          <Zap size={18} className="text-[var(--color-action)]" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            After Development
          </h2>
        </div>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-component)]">
          Choose what happens automatically once a roll is developed.
        </p>

        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Auto-design magazine */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-element)]">
              <BookOpen size={16} className="text-[var(--color-ink-secondary)] shrink-0" />
              <div>
                <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                  Design a magazine
                </span>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Auto-create a magazine from the developed roll
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateAutomation({ autoDesignMagazine: !automation.autoDesignMagazine })}
              role="switch"
              aria-checked={automation.autoDesignMagazine}
              aria-label="Auto-design magazine"
              className={`relative w-11 h-6 rounded-full transition-colors ${automation.autoDesignMagazine ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${automation.autoDesignMagazine ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
              />
            </button>
          </div>

          {/* Auto-post to circle */}
          <div className="flex flex-col gap-[var(--space-tight)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[var(--space-element)]">
                <Users size={16} className="text-[var(--color-ink-secondary)] shrink-0" />
                <div>
                  <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                    Post to circle
                  </span>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Share developed photos to a circle automatically
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const enabling = !automation.autoPostToCircle;
                  if (enabling && circles.length === 0) return;
                  const updates: Partial<AutomationSettings> = { autoPostToCircle: enabling };
                  if (enabling && !automation.autoPostCircleId && circles.length > 0) {
                    updates.autoPostCircleId = circles[0].id;
                  }
                  if (!enabling) {
                    updates.autoPostCircleId = null;
                  }
                  updateAutomation(updates);
                }}
                role="switch"
                aria-checked={automation.autoPostToCircle}
                aria-label="Auto-post to circle"
                className={`relative w-11 h-6 rounded-full transition-colors ${automation.autoPostToCircle ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${automation.autoPostToCircle ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {automation.autoPostToCircle && (
              <div className="ml-8">
                {circles.length === 0 ? (
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    No circles yet. Create a circle first to enable auto-posting.
                  </p>
                ) : (
                  <select
                    value={automation.autoPostCircleId || ''}
                    onChange={(e) => updateAutomation({ autoPostCircleId: e.target.value || null })}
                    className="w-full h-9 px-[var(--space-element)] text-[length:var(--text-caption)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-border-focus)]"
                  >
                    <option value="">Select a circle...</option>
                    {circles.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Auto-order prints */}
          <div className="flex flex-col gap-[var(--space-tight)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[var(--space-element)]">
                <Printer size={16} className="text-[var(--color-ink-secondary)] shrink-0" />
                <div>
                  <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                    Order prints
                  </span>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Automatically order prints of every developed roll
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateAutomation({ autoOrderPrints: !automation.autoOrderPrints })}
                role="switch"
                aria-checked={automation.autoOrderPrints}
                aria-label="Auto-order prints"
                className={`relative w-11 h-6 rounded-full transition-colors ${automation.autoOrderPrints ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${automation.autoOrderPrints ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {automation.autoOrderPrints && (
              <div className="ml-8 flex items-center gap-[var(--space-element)]">
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">Print size:</span>
                <div className="flex items-center gap-[var(--space-tight)]">
                  {(['4x6', '5x7', '8x10'] as const).map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => updateAutomation({ autoOrderPrintSize: size })}
                      className={`px-2 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                        automation.autoOrderPrintSize === size
                          ? 'bg-[var(--color-action)] text-white'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto-create reel */}
          <div className="flex flex-col gap-[var(--space-tight)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[var(--space-element)]">
                <Zap size={16} className="text-[var(--color-ink-secondary)] shrink-0" />
                <div>
                  <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                    Create a reel
                  </span>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Auto-assemble video clips into a reel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateAutomation({ autoCreateReel: !automation.autoCreateReel })}
                role="switch"
                aria-checked={automation.autoCreateReel}
                aria-label="Auto-create reel"
                className={`relative w-11 h-6 rounded-full transition-colors ${automation.autoCreateReel ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${automation.autoCreateReel ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
                />
              </button>
            </div>
            {automation.autoCreateReel && (
              <div className="ml-8 flex items-center gap-[var(--space-element)]">
                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">Output:</span>
                <div className="flex items-center gap-[var(--space-tight)]">
                  {(['horizontal', 'vertical'] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateAutomation({ autoReelOrientation: o })}
                      className={`px-2 py-0.5 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                        automation.autoReelOrientation === o
                          ? 'bg-[var(--color-action)] text-white'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]'
                      }`}
                    >
                      {o === 'horizontal' ? '16:9 Landscape' : '9:16 Portrait'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Auto-notify followers */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-element)]">
              <Globe size={16} className="text-[var(--color-ink-secondary)] shrink-0" />
              <div>
                <span className="text-[length:var(--text-body)] text-[var(--color-ink)]">
                  Notify followers
                </span>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Auto-publish a blog post and notify subscribers
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => updateAutomation({ autoNotifyFollowers: !automation.autoNotifyFollowers })}
              role="switch"
              aria-checked={automation.autoNotifyFollowers}
              aria-label="Auto-notify followers"
              className={`relative w-11 h-6 rounded-full transition-colors ${automation.autoNotifyFollowers ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'}`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${automation.autoNotifyFollowers ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>

        {/* Active automations summary */}
        {(automation.autoDesignMagazine || automation.autoPostToCircle || automation.autoOrderPrints || automation.autoCreateReel || automation.autoNotifyFollowers) && (
          <div className="mt-[var(--space-component)] pt-[var(--space-element)] border-t border-[var(--color-border)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              When a roll is developed:{' '}
              {[
                automation.autoDesignMagazine && 'magazine will be designed',
                automation.autoPostToCircle && automation.autoPostCircleId && 'photos will be shared to your circle',
                automation.autoOrderPrints && `${automation.autoOrderPrintSize} prints will be ordered`,
                automation.autoCreateReel && `a ${automation.autoReelOrientation === 'vertical' ? '9:16' : '16:9'} reel will be assembled`,
                automation.autoNotifyFollowers && 'a blog post will be published',
              ].filter(Boolean).join(', ')}.
            </p>
          </div>
        )}
      </Card>

      {/* Year in Review */}
      <Link href="/year-in-review">
        <Card className="flex items-center justify-between cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
          <div className="flex items-center gap-[var(--space-element)]">
            <CalendarHeart size={20} className="text-[var(--color-action)]" />
            <div>
              <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                Year in Review
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                See your {new Date().getFullYear()} photo stats and highlights
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-[var(--color-ink-tertiary)]" />
        </Card>
      </Link>

      {/* Privacy & Print Subscription */}
      <div className="grid grid-cols-2 gap-[var(--space-element)]">
        <Link href="/account/privacy">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <Shield size={18} className="text-[var(--color-action)] shrink-0" />
            <div>
              <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                Privacy & Data
              </span>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Your data, your control
              </p>
            </div>
          </Card>
        </Link>
        <Link href="/account/print-subscription">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <Printer size={18} className="text-[var(--color-action)] shrink-0" />
            <div>
              <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                Monthly Prints
              </span>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                $4.99/mo auto-prints
              </p>
            </div>
          </Card>
        </Link>
      </div>

      {/* Discover Section */}
      <div className="grid grid-cols-2 gap-[var(--space-element)]">
        <Link href="/collections">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <Layers size={18} className="text-[var(--color-action)] shrink-0" />
            <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              Collections
            </span>
          </Card>
        </Link>
        <Link href="/memories">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <Clock size={18} className="text-[var(--color-stock-warmth)] shrink-0" />
            <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              Memories
            </span>
          </Card>
        </Link>
        <Link href="/search">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <Search size={18} className="text-[var(--color-ink-secondary)] shrink-0" />
            <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              Search
            </span>
          </Card>
        </Link>
        <Link href="/map">
          <Card className="flex items-center gap-[var(--space-element)] cursor-pointer hover:shadow-[var(--shadow-floating)] transition-shadow">
            <MapPin size={18} className="text-[var(--color-stock-golden)] shrink-0" />
            <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              Photo Map
            </span>
          </Card>
        </Link>
      </div>

      {/* Invite Friends / Referral Section */}
      <Card>
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
          <Gift size={18} className="text-[var(--color-action)]" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Invite Friends
          </h2>
        </div>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-component)]">
          Share Roll with friends. They get a free roll of prints, you get credit toward yours.
        </p>

        {/* Email invite */}
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-component)]">
          <Input
            type="email"
            placeholder="friend@example.com"
            value={referralEmail}
            onChange={(e) => setReferralEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleReferralInvite();
            }}
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleReferralInvite}
            isLoading={referralSending}
            disabled={!referralEmail}
          >
            <Send size={14} className="mr-1" /> Send
          </Button>
        </div>

        {/* Copy link */}
        {referralStats?.referralCode && (
          <button
            onClick={handleCopyReferralLink}
            className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline"
          >
            <Copy size={12} />
            Copy your invite link
          </button>
        )}

        {/* Stats */}
        {referralStats && referralStats.totalInvited > 0 && (
          <div className="mt-[var(--space-component)] border-t border-[var(--color-border)] pt-[var(--space-component)]">
            <div className="grid grid-cols-3 gap-[var(--space-element)] text-center">
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  {referralStats.totalInvited}
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Invited
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  {referralStats.totalSignedUp}
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Joined
                </p>
              </div>
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-heading)] text-[var(--color-action)]">
                  {referralStats.totalConverted}
                </p>
                <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Converted
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Notifications Section */}
      <Card>
        <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-element)]">
          <Bell size={18} className="text-[var(--color-action)]" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Notifications
          </h2>
        </div>

        {pushPermission === 'unsupported' ? (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Push notifications are not supported on this device/browser.
          </p>
        ) : pushPermission === 'denied' ? (
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Notifications are blocked. Enable them in your browser settings to get notified when
            your rolls are ready, prints ship, and friends share photos.
          </p>
        ) : (
          <>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-component)]">
              Get notified when your rolls are developed, prints ship, or friends invite you to a
              circle.
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-[var(--space-element)]">
                {pushSubscribed ? (
                  <Bell size={16} className="text-[var(--color-developed)]" />
                ) : (
                  <BellOff size={16} className="text-[var(--color-ink-tertiary)]" />
                )}
                <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">
                  {pushSubscribed ? 'Notifications enabled' : 'Notifications off'}
                </span>
              </div>
              <Button
                variant={pushSubscribed ? 'ghost' : 'primary'}
                size="sm"
                onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
                isLoading={pushLoading}
              >
                {pushSubscribed ? 'Turn off' : 'Enable'}
              </Button>
            </div>
          </>
        )}
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
