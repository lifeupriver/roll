'use client';

import { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
  adminEmail: string;
}

export function AdminLayout({ children, adminEmail }: AdminLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="dark min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)]">
      <AdminSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main content */}
      <div className={`transition-all duration-200 ${collapsed ? 'ml-16' : 'ml-60'}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-6 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <div className="text-sm text-[var(--color-ink-tertiary)]">
            {/* Breadcrumb placeholder — pages can override */}
          </div>

          <div className="flex items-center gap-4">
            {/* Back to app link */}
            <Link
              href="/photos"
              className="text-xs text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors"
            >
              Back to app
            </Link>

            {/* Admin avatar */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center text-xs font-medium text-[var(--color-action)]">
                {adminEmail.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs text-[var(--color-ink-secondary)] hidden sm:inline">
                {adminEmail}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
