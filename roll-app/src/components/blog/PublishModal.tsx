'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { X, Globe, Tag, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/stores/toastStore';
import type { BlogPost } from '@/types/blog';

interface RollPhotoForCover {
  photo_id: string;
  photos?: {
    thumbnail_url?: string;
  } | null;
}

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  rollId: string;
  rollTitle: string;
  rollStory: string | null;
  rollPhotos: RollPhotoForCover[];
}

export function PublishModal({
  isOpen,
  onClose,
  rollId,
  rollTitle,
  rollStory,
  rollPhotos,
}: PublishModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [title, setTitle] = useState(rollTitle);
  const [excerpt, setExcerpt] = useState('');
  const [selectedCoverId, setSelectedCoverId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [allowPrints, setAllowPrints] = useState(true);
  const [allowMagazine, setAllowMagazine] = useState(false);
  const [allowBook, setAllowBook] = useState(false);

  // Create draft post when modal opens
  const draftInFlight = useRef(false);

  const createDraft = useCallback(async () => {
    if (draftInFlight.current) return;
    draftInFlight.current = true;
    setLoading(true);
    setDraftError(null);

    // Populate initial field values from roll data
    setTitle(rollTitle);
    setExcerpt(rollStory ? rollStory.split(/[.!?]/)[0]?.trim() || '' : '');
    setSelectedCoverId(rollPhotos[0]?.photo_id ?? null);

    try {
      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setDraftError(err.error || 'Failed to create draft');
        return;
      }
      const { data } = await res.json();
      const blogPost = data as BlogPost;
      setPost(blogPost);
      setTitle(blogPost.title || rollTitle);
      setExcerpt(blogPost.excerpt || '');
      setSelectedCoverId(blogPost.cover_photo_id);
      setTags(blogPost.tags || []);
      setAllowPrints(blogPost.allow_print_orders ?? true);
    } catch {
      setDraftError('Could not connect to create a draft. Please try again.');
    } finally {
      setLoading(false);
      draftInFlight.current = false;
    }
  }, [rollId, rollTitle, rollStory, rollPhotos]);

  useEffect(() => {
    if (!isOpen || post || draftInFlight.current) return;
    createDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSaveDraft = async (): Promise<boolean> => {
    if (!post) return false;
    setSaving(true);
    try {
      const res = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt: excerpt || null,
          cover_photo_id: selectedCoverId,
          tags,
          allow_print_orders: allowPrints,
          allow_magazine_orders: allowMagazine,
          allow_book_orders: allowBook,
        }),
      });
      if (res.ok) {
        toast('Draft saved', 'success');
        onClose();
        return true;
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to save', 'error');
        return false;
      }
    } catch {
      toast('Something went wrong', 'error');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    setPublishing(true);
    try {
      // Save fields first
      const saveRes = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          excerpt: excerpt || null,
          cover_photo_id: selectedCoverId,
          tags,
          allow_print_orders: allowPrints,
          allow_magazine_orders: allowMagazine,
          allow_book_orders: allowBook,
        }),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        toast(err.error || 'Failed to save', 'error');
        return;
      }

      // Then publish
      const res = await fetch(`/api/blog/posts/${post.id}/publish`, {
        method: 'POST',
      });
      if (res.ok) {
        toast('Published! Your roll is now public.', 'success');
        onClose();
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to publish', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setPublishing(false);
    }
  };

  const addTag = () => {
    const tag = tagInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[var(--space-component)] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
            Publish as Public Post
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-[var(--space-section)]">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--color-action)] border-t-transparent rounded-full" />
          </div>
        ) : draftError ? (
          <div className="flex flex-col items-center gap-[var(--space-element)] py-[var(--space-section)] text-center">
            <p className="text-[length:var(--text-body)] text-[var(--color-error)]">{draftError}</p>
            <Button variant="primary" size="sm" onClick={createDraft}>
              Try Again
            </Button>
          </div>
        ) : (
          <>
            {/* Title */}
            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                maxLength={200}
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
                Excerpt
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="A short summary for previews…"
                className="w-full h-20 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none"
                maxLength={500}
              />
            </div>

            {/* Cover photo selector */}
            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
                Cover Photo
              </label>
              <div className="flex gap-[var(--space-micro)] overflow-x-auto pb-[var(--space-tight)] scrollbar-hide">
                {rollPhotos.slice(0, 12).map((rp) => (
                  <button
                    key={rp.photo_id}
                    type="button"
                    onClick={() => setSelectedCoverId(rp.photo_id)}
                    className={`w-16 h-16 shrink-0 rounded-[var(--radius-sharp)] overflow-hidden border-2 transition-colors ${
                      selectedCoverId === rp.photo_id
                        ? 'border-[var(--color-action)]'
                        : 'border-transparent'
                    }`}
                  >
                    {rp.photos?.thumbnail_url && (
                      <Image
                        src={rp.photos.thumbnail_url}
                        alt=""
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        unoptimized
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] flex items-center gap-1 ">
                <Tag size={12} />
                Tags
              </label>
              <div className="flex flex-wrap gap-[var(--space-tight)] mb-[var(--space-tight)]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] text-[length:var(--text-caption)] px-[var(--space-tight)] py-0.5 rounded-[var(--radius-pill)]"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] min-w-[22px] min-h-[22px] flex items-center justify-center"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-[var(--space-tight)]">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag…"
                  className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-caption)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                  maxLength={50}
                />
                <Button variant="secondary" size="sm" onClick={addTag} disabled={!tagInput.trim()}>
                  Add
                </Button>
              </div>
            </div>

            {/* Ordering toggles */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] flex items-center gap-1">
                <Globe size={12} />
                Ordering Options
              </label>
              {(
                [
                  {
                    label: 'Allow visitors to order prints',
                    value: allowPrints,
                    setter: setAllowPrints,
                  },
                  {
                    label: 'Allow visitors to order magazine',
                    value: allowMagazine,
                    setter: setAllowMagazine,
                  },
                  { label: 'Allow visitors to order book', value: allowBook, setter: setAllowBook },
                ] as const
              ).map((toggle) => (
                <label
                  key={toggle.label}
                  className="flex items-center gap-[var(--space-element)] min-h-[44px] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={toggle.value}
                    onChange={(e) => toggle.setter(e.target.checked)}
                    className="w-4 h-4 accent-[var(--color-action)] rounded"
                  />
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink)]">
                    {toggle.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Design as essay */}
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-element)] border border-[var(--color-border)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[var(--space-element)]">
                  <Wand2 size={16} className="text-[var(--color-action)]" />
                  <div>
                    <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                      Design as Photo Essay
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      Auto-design a beautiful essay with editorial rhythm and typography
                    </p>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                    if (post) {
                      const saved = await handleSaveDraft();
                      if (!saved) return;
                    } else {
                      onClose();
                    }
                    router.push('/projects/posts/create');
                  }}
                >
                  Design
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-[var(--space-element)] pt-[var(--space-element)] border-t border-[var(--color-border)]">
              <Button variant="ghost" onClick={handleSaveDraft} isLoading={saving}>
                Save as Draft
              </Button>
              <Button
                variant="primary"
                onClick={handlePublish}
                isLoading={publishing}
                disabled={!title.trim()}
              >
                Publish Now
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
