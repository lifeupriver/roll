'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Show reconnected banner briefly
  if (wasOffline && isOnline) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-[var(--space-element)] px-[var(--space-component)] py-[var(--space-tight)] bg-[var(--color-check)] text-[var(--color-ink-inverse)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium animate-slide-down">
        <Wifi size={14} />
        Back online
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-0 inset-x-0 z-50 flex items-center justify-center gap-[var(--space-element)] px-[var(--space-component)] py-[var(--space-tight)] bg-[var(--color-ink)] text-[var(--color-ink-inverse)] text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium animate-slide-down">
        <WifiOff size={14} />
        You&apos;re offline — changes will sync when you reconnect
      </div>
    );
  }

  return null;
}
