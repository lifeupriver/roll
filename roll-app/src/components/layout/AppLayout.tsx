'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Image, Users, User, FolderOpen } from 'lucide-react';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useTheme } from '@/hooks/useTheme';

function DarkroomBulbIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17a1 1 0 001 1h6a1 1 0 001-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"
        fill={active ? 'var(--color-action)' : 'none'}
        stroke={active ? 'var(--color-action)' : 'var(--color-ink-tertiary)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={active ? 1 : 0.7}
      />
      <path d="M9 21h6" stroke={active ? 'var(--color-action)' : 'var(--color-ink-tertiary)'} strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.7} />
      <path d="M9 19h6" stroke={active ? 'var(--color-action)' : 'var(--color-ink-tertiary)'} strokeWidth="1.5" strokeLinecap="round" opacity={active ? 1 : 0.7} />
      {active && (
        <>
          <line x1="12" y1="0" x2="12" y2="1" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="4" y1="4" x2="4.7" y2="4.7" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="20" y1="4" x2="19.3" y2="4.7" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

const navItems = [
  { href: '/feed', label: 'Photos', icon: Grid3X3 },
  { href: '/library', label: 'Gallery', icon: Image },
  { href: '/projects', label: 'Projects', icon: FolderOpen },
  { href: '/circle', label: 'Circle', icon: Users },
  { href: '/account', label: 'Account', icon: User },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { theme, toggle: toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <OfflineBanner />

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-[var(--space-section)] p-[var(--space-section)]">
          <div className="flex items-center justify-between px-[var(--space-element)]">
            <Link
              href="/feed"
              className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] tracking-[0.15em] text-[var(--color-ink)]"
            >
              ROLL
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'darkroom' ? 'Switch to light mode' : 'Switch to darkroom mode'}
              className="p-1.5 rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors"
            >
              <DarkroomBulbIcon active={theme === 'darkroom'} />
            </button>
          </div>
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
        {/* Mobile top bar with nav labels + darkroom bulb */}
        <div className="lg:hidden flex items-center justify-between px-[var(--space-component)] pt-[var(--space-element)]">
          <nav className="flex items-center gap-[var(--space-element)]">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] transition-colors duration-150 ${
                    isActive
                      ? 'text-[var(--color-ink)]'
                      : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)]'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'darkroom' ? 'Switch to light mode' : 'Switch to darkroom mode'}
            className="p-2 rounded-[var(--radius-sharp)] hover:bg-[var(--color-surface-raised)] transition-colors shrink-0"
          >
            <DarkroomBulbIcon active={theme === 'darkroom'} />
          </button>
        </div>
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
                isActive ? 'text-[var(--color-action)]' : 'text-[var(--color-ink-tertiary)]'
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
