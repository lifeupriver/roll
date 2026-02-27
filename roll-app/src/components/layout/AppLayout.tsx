'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Grid3X3, Film, Users, User, Menu, X, Palette, Moon, Sun } from 'lucide-react';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { useTheme } from '@/hooks/useTheme';
import { useUser } from '@/hooks/useUser';

function DarkroomToggle({ theme, onToggle }: { theme: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
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
  );
}

const navItems = [
  { href: '/photos', label: 'Photos', icon: Grid3X3 },
  { href: '/videos', label: 'Videos', icon: Film },
  { href: '/designs', label: 'Designs', icon: Palette },
  { href: '/circle', label: 'Circle', icon: Users },
  { href: '/account', label: 'Account', icon: User },
];

// Stagger delay for drawer nav items (ms)
const DRAWER_ITEM_STAGGER = 50;
// Drawer slide duration (ms)
const DRAWER_SLIDE_DURATION = 200;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const { user } = useUser();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Close on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [drawerOpen]);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  // User display info
  const userInitial =
    user?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';
  const userName = user?.display_name || user?.email?.split('@')[0] || 'Guest';
  const userTier = user?.tier === 'pro' ? 'Roll+' : 'Free';

  return (
    <div className="min-h-[100dvh] bg-[var(--color-surface)] flex flex-col">
      <OfflineBanner />

      {/* Desktop sidebar — translucent, middle-aligned nav */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-xl">
        <div className="flex flex-col h-full">
          {/* Logo + theme toggle at top */}
          <div className="p-[var(--space-section)] pt-[var(--space-hero)] pb-0">
            <div className="flex items-center justify-between px-[var(--space-element)]">
              <Link
                href="/photos"
                className="font-[family-name:var(--font-display)] font-bold text-[2.5rem] tracking-[0.15em] text-[var(--color-ink)]"
              >
                ROLL
              </Link>
              <DarkroomToggle theme={theme} onToggle={toggle} />
            </div>
          </div>

          {/* Nav items — vertically centered */}
          <nav className="flex-1 flex flex-col justify-center gap-[var(--space-tight)] px-[var(--space-section)]">
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

          {/* Tagline at bottom */}
          <div className="p-[var(--space-section)] pt-0">
            <p className="px-[var(--space-element)] font-[family-name:var(--font-display)] font-light italic text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              Develop your roll.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile top bar with hamburger */}
      <header className="lg:hidden sticky top-0 z-30 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between h-12 px-[var(--space-component)]">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="p-2 -ml-2 text-[var(--color-ink)] touch-target"
          >
            <Menu size={22} strokeWidth={1.5} />
          </button>
          <Link
            href="/photos"
            className="font-[family-name:var(--font-display)] font-bold text-[2rem] tracking-[0.15em] text-[var(--color-ink)]"
          >
            ROLL
          </Link>
          <DarkroomToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      {/* Mobile slide-out drawer — enhanced with user identity and stagger animation */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Dim overlay */}
          <div
            className="absolute inset-0 bg-black/20 animate-[fadeIn_150ms_ease-out]"
            onClick={closeDrawer}
          />
          {/* Drawer panel */}
          <div className="absolute inset-y-0 left-0 w-64 bg-[var(--color-surface)]/85 backdrop-blur-xl shadow-[var(--shadow-overlay)] flex flex-col animate-[slideInLeft_200ms_ease-out]">
            {/* User identity at top */}
            <div className="px-[var(--space-component)] pt-[var(--space-section)] pb-[var(--space-element)] border-b border-[var(--color-border)]">
              <div className="flex items-center justify-between mb-[var(--space-element)]">
                <div className="flex items-center gap-[var(--space-element)]">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center shrink-0">
                      <span className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-action)]">
                        {userInitial}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-ink)] truncate">
                      {userName}
                    </p>
                    <span className="inline-block px-1.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--color-action-subtle)] text-[var(--color-action)] font-[family-name:var(--font-mono)] text-[10px] font-medium tracking-wide uppercase">
                      {userTier}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="p-2 -mr-2 text-[var(--color-ink-tertiary)] touch-target"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Nav items — positioned at ~40% from top, stagger entrance */}
            <nav className="flex-1 flex flex-col pt-[20%] gap-[var(--space-tight)] p-[var(--space-component)]">
              {navItems.map((item, index) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeDrawer}
                    className={`drawer-item-enter flex items-center gap-[var(--space-element)] px-[var(--space-element)] py-[var(--space-element)] rounded-[var(--radius-sharp)] text-[length:var(--text-body)] font-[family-name:var(--font-body)] font-medium transition-colors duration-150 ${
                      isActive
                        ? 'text-[var(--color-action)] bg-[var(--color-action-subtle)]'
                        : 'text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]'
                    }`}
                    style={{
                      animationDelay: `${DRAWER_SLIDE_DURATION + index * DRAWER_ITEM_STAGGER}ms`,
                    }}
                  >
                    <item.icon size={22} strokeWidth={1.5} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer footer */}
            <div className="p-[var(--space-component)] border-t border-[var(--color-border)]">
              <p className="font-[family-name:var(--font-display)] font-light italic text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Develop your roll.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main content — scales down when drawer is open */}
      <main
        className={`lg:pl-60 flex-1 transition-transform duration-200 ease-out origin-left ${
          drawerOpen ? 'scale-[0.97] translate-x-4' : ''
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-[var(--space-component)] lg:px-[var(--space-section)] py-[var(--space-component)] lg:py-[var(--space-section)]">
          {children}
        </div>
      </main>
    </div>
  );
}
