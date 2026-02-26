'use client';

import { useState } from 'react';
import { BackButton } from '@/components/ui/BackButton';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { BlogPostManager } from '@/components/blog/BlogPostManager';
import { BlogSettingsForm } from '@/components/blog/BlogSettingsForm';
import { Card } from '@/components/ui/Card';

type BlogTab = 'posts' | 'settings';

const TAB_OPTIONS = [
  { value: 'posts', label: 'Posts' },
  { value: 'settings', label: 'Settings' },
];

export default function BlogManagementPage() {
  const [tab, setTab] = useState<BlogTab>('posts');

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton href="/account" />
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          Blog
        </h1>
      </div>

      {/* Tab toggle */}
      <ContentModePills
        activeMode={tab}
        onChange={(mode) => setTab(mode as BlogTab)}
        options={TAB_OPTIONS}
        variant="primary"
      />

      {/* Content */}
      {tab === 'posts' && <BlogPostManager />}
      {tab === 'settings' && (
        <Card>
          <BlogSettingsForm />
        </Card>
      )}
    </div>
  );
}
