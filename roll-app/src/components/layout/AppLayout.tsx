'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Image, Users, User } from 'lucide-react';
import { OfflineBanner } from '@/components/ui/OfflineBanner';

const navItems = [
  { href: '/feed', label: 'Feed', icon: Grid3X3 },
  { href: '/library', label: 'Library', icon: Image },
  { href: '/circle', label: 'Circle', icon: Users },
  { href: '/account', label: 'Account', icon: User },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <OfflineBanner />

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-[var(--space-section)] p-[var(--space-section)]">
          <Link href="/feed" className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] tracking-[0.15em] text-[var(--color-ink)] px-[var(--space-element)]">
            ROLL
          </Link>
          <nav className="flex flex-col gap-[var(--space-tight)]">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-sharp)] text-[length:var(--text-label)] font-[family-name:var(--font-body)] font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--color-action)] bg-[var(--color-action-subtle)]'
                      : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]'
                  }`}
                >
                  <item.icon size={24} strokeWidth={1.5} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:pl-60 pb-14 lg:pb-0">
        <div className="max-w-[1200px] mx-auto px-[var(--space-component)] lg:px-[var(--space-section)] py-[var(--space-section)]">
          {children}
        </div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-around z-40">
        {navItems.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 min-w-[64px] touch-target ${
                isActive
                  ? 'text-[var(--color-action)]'
                  : 'text-[var(--color-ink-tertiary)]'
              }`}
            >
              <item.icon size={24} strokeWidth={1.5} />
              <span className="text-[length:var(--text-caption)] font-[family-name:var(--font-body)] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
