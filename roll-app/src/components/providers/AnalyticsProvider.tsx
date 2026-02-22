'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { initAnalytics, track, identify } from '@/lib/analytics';
import { initSentry, setSentryUser } from '@/lib/sentry';
import { useUser } from '@/hooks/useUser';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const prevPathname = useRef<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    initAnalytics();
    initSentry();
  }, []);

  // Identify user when available
  useEffect(() => {
    if (user) {
      identify(user.id, {
        email: user.email,
        tier: user.tier,
        photoCount: user.photo_count,
      });
      setSentryUser(user.id, user.email);
    }
  }, [user]);

  // Track page views on route change
  useEffect(() => {
    if (pathname && pathname !== prevPathname.current) {
      prevPathname.current = pathname;
      track({ event: '$pageview', properties: { path: pathname } });
    }
  }, [pathname]);

  return <>{children}</>;
}
