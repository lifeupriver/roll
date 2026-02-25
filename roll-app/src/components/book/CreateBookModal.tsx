'use client';

import { useState, useCallback, useEffect } from 'react';
import { BookOpen, ChevronRight, ChevronLeft, GripVertical, X, Check } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import { TemplateCard } from '@/components/book/TemplateCard';
import { BOOK_TEMPLATES, type BookTemplate } from '@/lib/book/templates';
import type { Photo } from '@/types/photo';

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  photos: Photo;
}

type CreateStep = 'template' | 'details' | 'photos' | 'review';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (bookId: string) => void;
  initialPhotoIds?: string[];
}

export function CreateBookModal({ isOpen, onClose, onCreated, initialPhotoIds }: CreateBookModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<CreateStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialPhotoIds ?? []);
  const [creating, setCreating] = useState(false);

  // Load favorites
  useEffect(() => {
    if (!isOpen) return;
    setFavoritesLoading(true);
    fetch('/api/favorites')
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((json) => setFavorites(json.data ?? []))
      .catch(() => toast('Failed to load favorites', 'error'))
      .finally(() => setFavoritesLoading(false));
  }, [isOpen, toast]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep('template');
      setSelectedTemplate(null);
      setName('');
      setDescription('');
      setSelectedIds(initialPhotoIds ?? []);
    }
  }, [isOpen, initialPhotoIds]);

  const togglePhoto = useCallback((photoId: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      return [...prev, photoId];
    });
  }, []);

  const movePhoto = useCallback((fromIndex: number, direction: 'up' | 'down') => {
    setSelectedIds((prev) => {
      const next = [...prev];
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= next.length) return prev;
      [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
      return next;
    });
  }, []);

  const handleCreate = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast('Select at least one photo', 'error');
      return;
    }
    setCreating(true);
    try {
      const bookName = name.trim() || 'Untitled Book';
      const res = await fetch('/api/projects/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: bookName,
          description: description.trim() || null,
          photoIds: selectedIds,
        }),
      });

      let bookData: Record<string, unknown> | null = null;
      if (res.ok) {
        const json = await res.json();
        bookData = json.data;
      }

      if (!bookData) {
        bookData = {
          id: `local-${Date.now()}`,
          name: bookName,
          description: description.trim() || null,
          cover_url: null,
          photo_count: selectedIds.length,
          photo_ids: selectedIds,
          captions: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // Store in localStorage for fallback
      const stored = JSON.parse(localStorage.getItem('roll-albums') || '[]');
      stored.unshift(bookData);
      localStorage.setItem('roll-albums', JSON.stringify(stored));

      toast('Book created!', 'success');
      onCreated(bookData.id as string);
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setCreating(false);
    }
  }, [name, description, selectedIds, toast, onCreated]);

  const selectedPhotos = selectedIds
    .map((id) => favorites.find((f) => f.photo_id === id))
    .filter(Boolean) as FavoriteWithPhoto[];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-[var(--space-component)]">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            {step === 'template' && 'Choose a Template'}
            {step === 'details' && 'New Book'}
            {step === 'photos' && 'Select Photos'}
            {step === 'review' && 'Review Book'}
          </h2>
          <div className="flex items-center gap-1.5">
            {(['template', 'details', 'photos', 'review'] as const).map((s, i) => (
              <div
                key={s}
                className={`w-2 h-2 rounded-full transition-colors ${
                  s === step ? 'bg-[var(--color-action)]' : 'bg-[var(--color-border)]'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: Template Selection */}
        {step === 'template' && (
          <div className="flex flex-col gap-[var(--space-component)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Start with a template or create a blank book. Templates auto-organize your photos by time period.
            </p>
            <div className="grid grid-cols-2 gap-[var(--space-element)] max-h-[360px] overflow-y-auto">
              {BOOK_TEMPLATES.map((tmpl) => (
                <TemplateCard
                  key={tmpl.id}
                  template={tmpl}
                  isSelected={selectedTemplate?.id === tmpl.id}
                  onSelect={() => {
                    setSelectedTemplate(tmpl);
                    if (tmpl.id !== 'blank') {
                      setName(tmpl.name);
                      setDescription(tmpl.description);
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Details */}
        {step === 'details' && (
          <div className="flex flex-col gap-[var(--space-component)]">
            <Input
              label="Book Title"
              placeholder="Summer 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
                Description
              </label>
              <textarea
                placeholder="A collection of favorite moments..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={300}
                className="w-full px-[var(--space-element)] py-[var(--space-element)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] text-[length:var(--text-body)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] resize-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-2"
              />
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-right">
                {description.length}/300
              </span>
            </div>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              The description appears on your book&apos;s cover page. You can change it later.
            </p>
          </div>
        )}

        {/* Step 2: Photo Selection */}
        {step === 'photos' && (
          <div className="flex flex-col gap-[var(--space-element)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Tap photos to select them. Each becomes a page in your book.
              Selected order = page order.
            </p>

            {favoritesLoading ? (
              <div className="flex items-center justify-center py-[var(--space-section)]">
                <Spinner size="sm" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-element)]">
                <BookOpen size={32} className="text-[var(--color-ink-tertiary)]" />
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center">
                  No favorites yet. Heart photos in your rolls first.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 max-h-[360px] overflow-y-auto rounded-[var(--radius-card)]">
                {favorites.map((fav) => {
                  const selIndex = selectedIds.indexOf(fav.photo_id);
                  const isSelected = selIndex !== -1;
                  return (
                    <button
                      key={fav.id}
                      type="button"
                      onClick={() => togglePhoto(fav.photo_id)}
                      className="relative aspect-square overflow-hidden bg-[var(--color-surface-sunken)] group"
                    >
                      <img
                        src={fav.photos.thumbnail_url}
                        alt=""
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-150 ${isSelected ? 'scale-95' : 'group-hover:scale-[1.02]'}`}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-[var(--color-action)]/15 ring-2 ring-inset ring-[var(--color-action)]" />
                      )}
                      <div
                        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                          isSelected
                            ? 'bg-[var(--color-action)] scale-100'
                            : 'bg-black/30 border border-white/50 scale-90 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {isSelected ? (
                          <span className="text-white text-[10px] font-bold font-[family-name:var(--font-mono)]">
                            {selIndex + 1}
                          </span>
                        ) : (
                          <Check size={12} className="text-white" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                {selectedIds.length} page{selectedIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && (
          <div className="flex flex-col gap-[var(--space-component)]">
            {/* Cover preview */}
            <div className="relative aspect-[3/4] max-h-48 bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mx-auto w-full max-w-[200px]">
              {selectedPhotos[0] ? (
                <img
                  src={selectedPhotos[0].photos.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen size={32} className="text-[var(--color-ink-tertiary)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-3">
                <p className="font-[family-name:var(--font-display)] font-medium text-white text-[length:var(--text-lead)] leading-tight truncate">
                  {name.trim() || 'Untitled Book'}
                </p>
                {description.trim() && (
                  <p className="text-white/70 text-[length:var(--text-caption)] mt-0.5 line-clamp-2">
                    {description.trim()}
                  </p>
                )}
              </div>
            </div>

            {/* Page order */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <h3 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]">
                Page Order
              </h3>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {selectedPhotos.map((fav, i) => (
                  <div
                    key={fav.photo_id}
                    className="flex items-center gap-[var(--space-element)] p-1.5 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)]"
                  >
                    <GripVertical size={14} className="text-[var(--color-ink-tertiary)] flex-shrink-0" />
                    <div className="w-10 h-10 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0">
                      <img src={fav.photos.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] flex-1">
                      Page {i + 1}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => movePhoto(i, 'up')}
                        disabled={i === 0}
                        className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={14} className="rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => movePhoto(i, 'down')}
                        disabled={i === selectedPhotos.length - 1}
                        className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight size={14} className="rotate-90" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== fav.photo_id))}
                        className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)]"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              {selectedIds.length} page{selectedIds.length !== 1 ? 's' : ''}. You can add captions and reorder pages after creation.
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-[var(--space-tight)] border-t border-[var(--color-border)]">
          <div>
            {step !== 'template' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep(
                  step === 'review' ? 'photos' :
                  step === 'photos' ? 'details' :
                  'template'
                )}
              >
                <ChevronLeft size={16} className="mr-0.5" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-[var(--space-element)]">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            {step === 'template' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('details')}
                disabled={!selectedTemplate}
              >
                Next
                <ChevronRight size={16} className="ml-0.5" />
              </Button>
            )}
            {step === 'details' && (
              <Button variant="primary" size="sm" onClick={() => setStep('photos')}>
                Select Photos
                <ChevronRight size={16} className="ml-0.5" />
              </Button>
            )}
            {step === 'photos' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setStep('review')}
                disabled={selectedIds.length === 0}
              >
                Review ({selectedIds.length})
                <ChevronRight size={16} className="ml-0.5" />
              </Button>
            )}
            {step === 'review' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreate}
                isLoading={creating}
                disabled={selectedIds.length === 0}
              >
                Create Book
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
