'use client';

import { useUser } from '@/hooks/useUser';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

export default function AccountPage() {
  const { user, loading: userLoading } = useUser();
  const { logout, loading: logoutLoading } = useAuth();

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
          </div>
        </div>
      </Card>

      {/* Subscription Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Subscription
        </h2>
        <div className="flex items-center gap-[var(--space-element)]">
          <Badge variant={user?.tier === 'plus' ? 'action' : 'processing'}>
            {user?.tier === 'plus' ? 'Roll+' : 'Free'}
          </Badge>
        </div>
      </Card>

      {/* Storage Section */}
      <Card>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
          Storage
        </h2>
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          {user?.photo_count || 0} photos uploaded
        </p>
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
