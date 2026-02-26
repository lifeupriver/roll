'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Eye, ShoppingCart, Trash2, Printer, ImagePlus } from 'lucide-react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { MagazinePreview } from '@/components/magazine/MagazinePreview';
import { MagazinePageEditor } from '@/components/magazine/MagazinePageEditor';
import { Modal } from '@/components/ui/Modal';
import { RollSelector } from '@/components/magazine/RollSelector';
import { useToast } from '@/stores/toastStore';
import type { Magazine, MagazinePage } from '@/types/magazine';

export default function MagazineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [magazine, setMagazine] = useState<Magazine | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  const [pages, setPages] = useState<MagazinePage[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoUrlMap, setPhotoUrlMap] = useState<Map<string, string>>(new Map());
  const [showAddRolls, setShowAddRolls] = useState(false);
  const [addRollIds, setAddRollIds] = useState<string[]>([]);
  const [addingFromRolls, setAddingFromRolls] = useState(false);

  // Fetch magazine
  useEffect(() => {
    async function fetchMagazine() {
      try {
        const res = await fetch(`/api/magazines/${id}`);
        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          toastRef.current(errJson.error || 'Failed to load magazine', 'error');
          return;
        }

        const json = await res.json();
        const mag = json.data as Magazine;
        setMagazine(mag);
        const parsedPages = typeof mag.pages === 'string' ? JSON.parse(mag.pages) : mag.pages;
        setPages(parsedPages);

        // Fetch photo storage keys to build URL map
        const photoIds = parsedPages
          .flatMap((p: MagazinePage) => p.photos.map((ph) => ph.id))
          .filter(Boolean);

        if (photoIds.length > 0) {
          const photoRes = await fetch(`/api/photos/batch?ids=${photoIds.join(',')}`);
          if (photoRes.ok) {
            const photoJson = await photoRes.json();
            const map = new Map<string, string>();
            (photoJson.data ?? []).forEach((p: { id: string; storage_key: string; thumbnail_url: string }) => {
              const url = p.thumbnail_url || (p.storage_key ? `/api/photos/serve?key=${encodeURIComponent(p.storage_key)}` : '');
              if (url) map.set(p.id, url);
            });
            setPhotoUrlMap(map);
          }
        }
      } catch {
        toastRef.current('Failed to load magazine', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazine();
  }, [id]);

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
    setPages((prev) => prev.map((p, i) => (i === pageIndex ? { ...p, caption } : p)));
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

  const handleAddFromRolls = useCallback(async () => {
    if (addRollIds.length === 0 || addingFromRolls) return;
    setAddingFromRolls(true);
    try {
      // Fetch photos from selected rolls
      const allNewPhotos: MagazinePage[] = [];
      for (const rollId of addRollIds) {
        const res = await fetch(`/api/rolls/${rollId}/photos`);
        if (!res.ok) continue;
        const json = await res.json();
        const rollPhotos = json.data ?? [];
        for (const rp of rollPhotos) {
          const photo = rp.photos || rp;
          allNewPhotos.push({
            layout: 'full',
            photos: [
              {
                id: photo.id || rp.photo_id,
                photo_id: photo.id || rp.photo_id,
                thumbnail_url: photo.thumbnail_url || '',
                developed_url: photo.developed_url || photo.storage_key || '',
                width: photo.width || 0,
                height: photo.height || 0,
                caption: rp.caption || undefined,
              },
            ],
            caption: rp.caption || '',
          });
        }
      }
      if (allNewPhotos.length > 0) {
        setPages((prev) => [...prev, ...allNewPhotos]);
        toast(`Added ${allNewPhotos.length} pages from rolls`, 'success');
        setMode('edit');
      }
      setShowAddRolls(false);
      setAddRollIds([]);
    } catch {
      toast('Failed to add images from rolls', 'error');
    } finally {
      setAddingFromRolls(false);
    }
  }, [addRollIds, addingFromRolls, toast]);

  const handleDelete = async () => {
    if (!confirm('Delete this magazine? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/magazines/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Magazine deleted', 'success');
        router.push('/designs');
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
          <BackButton href="/designs" />
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

      {/* Add images from rolls */}
      {mode === 'edit' && (
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowAddRolls(true)}
        >
          <ImagePlus size={18} className="mr-2" />
          Add Images from Rolls
        </Button>
      )}

      {/* Order This Magazine CTA */}
      {(magazine.status === 'draft' || magazine.status === 'review') && (
        <Link href={`/projects/magazines/${id}/review`} className="block">
          <div className="bg-[var(--color-action)] text-white rounded-[var(--radius-card)] p-[var(--space-component)] flex items-center justify-between cursor-pointer hover:opacity-90 transition-opacity">
            <div className="flex items-center gap-[var(--space-element)]">
              <Printer size={24} />
              <div>
                <p className="text-[length:var(--text-body)] font-medium">Order This Magazine</p>
                <p className="text-[length:var(--text-caption)] opacity-80">
                  {pages.length} pages · {magazine.format} format
                  {magazine.price_cents
                    ? ` · $${(magazine.price_cents / 100).toFixed(2)} + shipping`
                    : ''}
                </p>
              </div>
            </div>
            <div className="shrink-0 bg-white/20 rounded-[var(--radius-pill)] px-3 py-1.5 text-[length:var(--text-label)] font-medium">
              Order
            </div>
          </div>
        </Link>
      )}

      {/* Price info */}
      {magazine.price_cents && !(magazine.status === 'draft' || magazine.status === 'review') && (
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

      {/* Add from Rolls Modal */}
      <Modal isOpen={showAddRolls} onClose={() => setShowAddRolls(false)} title="Add Images from Rolls">
        <div className="flex flex-col gap-[var(--space-component)]">
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Select developed rolls to add their photos to this magazine.
          </p>
          <RollSelector
            selectedRollIds={addRollIds}
            onSelectionChange={setAddRollIds}
            maxRolls={4}
          />
          <div className="flex justify-end gap-2 pt-[var(--space-element)]">
            <Button variant="ghost" size="sm" onClick={() => setShowAddRolls(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddFromRolls}
              isLoading={addingFromRolls}
              disabled={addRollIds.length === 0}
            >
              Add Photos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
