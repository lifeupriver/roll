'use client';

import { useState, useEffect, useCallback } from 'react';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import type { BlogSettings } from '@/types/blog';

export function BlogSettingsForm() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<BlogSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [blogSlug, setBlogSlug] = useState('');
  const [blogName, setBlogName] = useState('');
  const [blogDescription, setBlogDescription] = useState('');
  const [blogEnabled, setBlogEnabled] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/blog/settings');
      if (res.ok) {
        const { data } = await res.json();
        const s = data as BlogSettings;
        setSettings(s);
        setBlogSlug(s.blog_slug || '');
        setBlogName(s.blog_name || '');
        setBlogDescription(s.blog_description || '');
        setBlogEnabled(s.blog_enabled);
      }
    } catch {
      toast('Failed to load blog settings', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    const slug = blogSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!slug) {
      toast('Blog URL is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/blog/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blog_slug: slug,
          blog_name: blogName.trim() || null,
          blog_description: blogDescription.trim() || null,
          blog_enabled: blogEnabled,
        }),
      });

      if (res.ok) {
        const { data } = await res.json();
        setSettings(data);
        setBlogSlug(data.blog_slug || '');
        toast('Blog settings saved', 'success');
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to save', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[var(--space-component)]">
        <Spinner size="sm" />
      </div>
    );
  }

  const hasChanges =
    blogSlug !== (settings?.blog_slug || '') ||
    blogName !== (settings?.blog_name || '') ||
    blogDescription !== (settings?.blog_description || '') ||
    blogEnabled !== settings?.blog_enabled;

  return (
    <div className="flex flex-col gap-[var(--space-component)]">
      {/* Blog URL */}
      <div>
        <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
          Blog URL
        </label>
        <div className="flex items-center gap-[var(--space-tight)]">
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] shrink-0">
            /blog/
          </span>
          <input
            type="text"
            value={blogSlug}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setBlogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
            }
            placeholder="your-blog-name"
            className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            maxLength={60}
          />
        </div>
      </div>

      {/* Blog Name */}
      <div>
        <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
          Blog Name
        </label>
        <input
          type="text"
          value={blogName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlogName(e.target.value)}
          placeholder="My Photography Blog"
          className="w-full bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          maxLength={100}
        />
      </div>

      {/* Blog Description */}
      <div>
        <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
          Description
        </label>
        <textarea
          value={blogDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBlogDescription(e.target.value)}
          placeholder="A few words about your blog..."
          rows={3}
          className="w-full bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none"
          maxLength={300}
        />
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-micro)]">
          {blogDescription.length}/300
        </p>
      </div>

      {/* Blog Enabled Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-element)]">
          <Globe size={16} className="text-[var(--color-action)]" />
          <div>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium">
              Blog enabled
            </p>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              Make your blog publicly accessible
            </p>
          </div>
        </div>
        <button
          onClick={() => setBlogEnabled(!blogEnabled)}
          role="switch"
          aria-checked={blogEnabled}
          aria-label="Enable blog"
          className={`relative w-12 h-7 rounded-[var(--radius-pill)] transition-colors duration-200 ${
            blogEnabled ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'
          }`}
        >
          <span
            className={`absolute top-[2px] left-[2px] w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-transform duration-200 flex items-center justify-center ${
              blogEnabled ? 'translate-x-[20px]' : 'translate-x-0'
            }`}
          >
            {blogEnabled && <Check size={12} className="text-[var(--color-action)]" />}
          </span>
        </button>
      </div>

      {/* Save */}
      <Button
        variant="primary"
        onClick={handleSave}
        isLoading={saving}
        disabled={!hasChanges}
      >
        Save Settings
      </Button>
    </div>
  );
}
