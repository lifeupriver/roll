'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Eye, ShoppingCart, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MagazinePreview } from '@/components/magazine/MagazinePreview';
import { MagazinePageEditor } from '@/components/magazine/MagazinePageEditor';
import { useToast } from '@/stores/toastStore';
import type { Magazine, MagazinePage } from '@/types/magazine';

export default function MagazineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [pages, setPages] = useState<MagazinePage[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoUrlMap, setPhotoUrlMap] = useState<Map<string, string>>(new Map());

  // Fetch magazine
  useEffect(() => {
    async function fetchMagazine() {
      try {
        const res = await fetch(`/api/magazines/${id}`);
        if (res.ok) {
          const json = await res.json();
          const mag = json.data as Magazine;
          setMagazine(mag);
          const parsedPages = typeof mag.pages === 'string' ? JSON.parse(mag.pages) : mag.pages;
          setPages(parsedPages);

          // Fetch photo URLs for all photos in the magazine
          const photoIds = parsedPages
            .flatMap((p: MagazinePage) => p.photos.map((ph) => ph.id))
            .filter(Boolean);

          if (photoIds.length > 0) {
            const photoRes = await fetch(`/api/photos?ids=${photoIds.join(',')}`);
            if (photoRes.ok) {
              const photoJson = await photoRes.json();
              const map = new Map<string, string>();
              (photoJson.data ?? []).forEach((p: { id: string; thumbnail_url: string }) => {
                map.set(p.id, p.thumbnail_url);
              });
              setPhotoUrlMap(map);
            }
          }
        }
      } catch {
        toast('Failed to load magazine', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazine();
  }, [id, toast]);

  const handleReorder = useCallback((fromIndex: number, toIndex: number) => {
    setPages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, removed);
      return next;
    });
  }, []);

  const handleRemove = useCallback((pageIndex: number) => {
    setPages((prev) => prev.filter((_, i) => i !== pageIndex));
  }, []);

  const handleCaptionChange = useCallback((pageIndex: number, caption: string) => {
    setPages((prev) =>
      prev.map((p, i) => (i === pageIndex ? { ...p, caption } : p))
    );
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/magazines/${id}/pages`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast('Changes saved', 'success');
      setMode('read');
    } catch {
      toast('Failed to save changes', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this magazine? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/magazines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Magazine deleted', 'success');
        router.push('/projects/magazines');
      }
    } catch {
      toast('Failed to delete', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-section)]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!magazine) {
    return (
      <div className="text-center py-[var(--space-section)] text-[var(--color-ink-secondary)]">
        Magazine not found
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[var(--space-element)]">
          <button
            type="button"
            onClick={() => router.push('/projects/magazines')}
            className="p-2 -ml-2 rounded-[var(--radius-sharp)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)]"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
              {magazine.title}
            </h1>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {pages.length} pages · {magazine.format} · {magazine.template}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'read' ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode('edit')}>
                <Pencil size={14} className="mr-1" /> Edit
              </Button>
              {(magazine.status === 'draft' || magazine.status === 'review') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push(`/projects/magazines/${id}/review`)}
                >
                  <ShoppingCart size={14} className="mr-1" /> Order Print
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setMode('read')}>
                <Eye size={14} className="mr-1" /> Preview
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} isLoading={saving}>
                Save Changes
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={handleDelete}>
            <Trash2 size={14} className="text-[var(--color-error)]" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {mode === 'read' ? (
        <MagazinePreview pages={pages} photoUrlMap={photoUrlMap} />
      ) : (
        <MagazinePageEditor
          pages={pages}
          photoUrlMap={photoUrlMap}
          onReorder={handleReorder}
          onRemove={handleRemove}
          onCaptionChange={handleCaptionChange}
        />
      )}

      {/* Price info */}
      {magazine.price_cents && (
        <div className="flex items-center justify-center gap-2 py-[var(--space-element)] border-t border-[var(--color-border)]">
          <span className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Estimated price:
          </span>
          <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-lead)] text-[var(--color-ink)]">
            ${(magazine.price_cents / 100).toFixed(2)}
          </span>
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            + shipping
          </span>
        </div>
      )}
    </div>
  );
}
