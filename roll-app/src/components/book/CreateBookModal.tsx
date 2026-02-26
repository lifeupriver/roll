'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  X,
  Wand2,
  Palette,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';
import { TemplateCard } from '@/components/book/TemplateCard';
import { BOOK_TEMPLATES, type BookTemplate } from '@/lib/book/templates';
import type { Magazine } from '@/types/magazine';

type SourceType = 'rolls' | 'magazines';
type CreateStep = 'template' | 'details' | 'source' | 'select' | 'review';

interface CreateBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (bookId: string) => void;
  initialPhotoIds?: string[];
}

interface RollForSelection {
  id: string;
  title: string;
  theme_name: string | null;
  created_at: string;
  photo_count: number;
  cover_url: string | null;
}

export function CreateBookModal({
  isOpen,
  onClose,
  onCreated,
}: CreateBookModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<CreateStep>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<BookTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('magazines');

  // Magazines state
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [magazinesLoading, setMagazinesLoading] = useState(false);
  const [selectedMagIds, setSelectedMagIds] = useState<string[]>([]);

  // Rolls state
  const [rolls, setRolls] = useState<RollForSelection[]>([]);
  const [rollsLoading, setRollsLoading] = useState(false);
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);

  const [creating, setCreating] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    setMagazinesLoading(true);
    fetch('/api/magazines')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => setMagazines(json.data ?? []))
      .catch(() => {})
      .finally(() => setMagazinesLoading(false));

    setRollsLoading(true);
    fetch('/api/rolls?status=developed')
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((json) => {
        const data = json.data ?? [];
        setRolls(
          data.map((r: Record<string, unknown>) => ({
            id: r.id as string,
            title: (r.title as string) || (r.theme_name as string) || 'Untitled Roll',
            theme_name: r.theme_name as string | null,
            created_at: r.created_at as string,
            photo_count: (r.photo_count as number) || 0,
            cover_url: (r.cover_url as string) || null,
          }))
        );
      })
      .catch(() => {})
      .finally(() => setRollsLoading(false));
  }, [isOpen]);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setStep('template');
      setSelectedTemplate(null);
      setName('');
      setDescription('');
      setSourceType('magazines');
      setSelectedMagIds([]);
      setSelectedRollIds([]);
    }
  }, [isOpen]);

  const selectedIds = sourceType === 'magazines' ? selectedMagIds : selectedRollIds;

  const toggleItem = useCallback(
    (id: string) => {
      const setter = sourceType === 'magazines' ? setSelectedMagIds : setSelectedRollIds;
      setter((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        return [...prev, id];
      });
    },
    [sourceType]
  );

  const moveItem = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const setter = sourceType === 'magazines' ? setSelectedMagIds : setSelectedRollIds;
      setter((prev) => {
        const next = [...prev];
        const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
        if (toIndex < 0 || toIndex >= next.length) return prev;
        [next[fromIndex], next[toIndex]] = [next[toIndex], next[fromIndex]];
        return next;
      });
    },
    [sourceType]
  );

  const removeItem = useCallback(
    (id: string) => {
      const setter = sourceType === 'magazines' ? setSelectedMagIds : setSelectedRollIds;
      setter((prev) => prev.filter((x) => x !== id));
    },
    [sourceType]
  );

  const selectedMagazines = selectedMagIds
    .map((id) => magazines.find((m) => m.id === id))
    .filter(Boolean) as Magazine[];

  const selectedRolls = selectedRollIds
    .map((id) => rolls.find((r) => r.id === id))
    .filter(Boolean) as RollForSelection[];

  const totalPageCount =
    sourceType === 'magazines'
      ? selectedMagazines.reduce((sum, m) => sum + (m.page_count || 0), 0)
      : selectedRolls.reduce((sum, r) => sum + (r.photo_count || 0), 0);

  const handleCreate = useCallback(async () => {
    if (selectedIds.length === 0) {
      toast(`Select at least one ${sourceType === 'magazines' ? 'magazine' : 'roll'}`, 'error');
      return;
    }
    setCreating(true);
    try {
      const bookName = name.trim() || 'Untitled Book';
      const payload: Record<string, unknown> = {
        name: bookName,
        description: description.trim() || null,
      };

      if (sourceType === 'magazines') {
        payload.magazine_ids = selectedMagIds;
      } else {
        payload.roll_ids = selectedRollIds;
      }

      const res = await fetch('/api/projects/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
          photo_count: totalPageCount,
          ...(sourceType === 'magazines'
            ? { magazine_ids: selectedMagIds }
            : { roll_ids: selectedRollIds }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, description, sourceType, selectedMagIds, selectedRollIds, totalPageCount, toast, onCreated]);

  const stepBack = useCallback(() => {
    if (step === 'review') setStep('select');
    else if (step === 'select') setStep('source');
    else if (step === 'source') setStep('details');
    else if (step === 'details') setStep('template');
  }, [step]);

  const STEPS: CreateStep[] = ['template', 'details', 'source', 'select', 'review'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-[var(--space-component)]">
        {/* Header with step indicator */}
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            {step === 'template' && 'Choose a Template'}
            {step === 'details' && 'New Book'}
            {step === 'source' && 'Build From'}
            {step === 'select' &&
              (sourceType === 'magazines' ? 'Select Magazine Designs' : 'Select Rolls')}
            {step === 'review' && 'Review Book'}
          </h2>
          <div className="flex items-center gap-1.5">
            {STEPS.map((s) => (
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
              Start with a template or create a blank book.
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
                placeholder="A collection of your best work..."
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

        {/* Step 2: Source Selection (Rolls or Magazines) */}
        {step === 'source' && (
          <div className="flex flex-col gap-[var(--space-component)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Choose how to build your book. You can compile from magazine designs or directly from
              developed rolls.
            </p>
            <div className="grid grid-cols-2 gap-[var(--space-element)]">
              <button
                type="button"
                onClick={() => setSourceType('magazines')}
                className={`flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-colors ${
                  sourceType === 'magazines'
                    ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                }`}
              >
                <Palette size={32} className="text-[var(--color-ink-secondary)]" />
                <div className="text-center">
                  <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                    Magazine Designs
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Compile multiple magazine designs into chapters
                  </p>
                </div>
                {magazines.length > 0 && (
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {magazines.length} available
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSourceType('rolls')}
                className={`flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-colors ${
                  sourceType === 'rolls'
                    ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                }`}
              >
                <Wand2 size={32} className="text-[var(--color-ink-secondary)]" />
                <div className="text-center">
                  <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                    Developed Rolls
                  </p>
                  <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    Build directly from your developed roll photos
                  </p>
                </div>
                {rolls.length > 0 && (
                  <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                    {rolls.length} available
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Selection (Magazine or Roll list) */}
        {step === 'select' && sourceType === 'magazines' && (
          <div className="flex flex-col gap-[var(--space-element)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Select magazine designs to compile into your book. Each becomes a chapter.
            </p>

            {magazinesLoading ? (
              <div className="flex items-center justify-center py-[var(--space-section)]">
                <Spinner size="sm" />
              </div>
            ) : magazines.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-element)]">
                <BookOpen size={32} className="text-[var(--color-ink-tertiary)]" />
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center">
                  No magazine designs yet. Create a magazine first.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[var(--space-element)] max-h-[360px] overflow-y-auto">
                {magazines.map((mag) => {
                  const selIndex = selectedMagIds.indexOf(mag.id);
                  const isSelected = selIndex !== -1;
                  return (
                    <button
                      key={mag.id}
                      type="button"
                      onClick={() => toggleItem(mag.id)}
                      className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-colors min-h-[44px] text-left ${
                        isSelected
                          ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                      }`}
                    >
                      <div className="w-12 h-16 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-sunken)]">
                        <BookOpen size={16} className="text-[var(--color-ink-tertiary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
                          {mag.title}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                          {mag.page_count} pages &middot; {mag.format}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[var(--color-action)]'
                            : 'border-2 border-[var(--color-border)]'
                        }`}
                      >
                        {isSelected && (
                          <span className="text-white text-[10px] font-bold font-[family-name:var(--font-mono)]">
                            {selIndex + 1}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMagIds.length > 0 && (
              <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                {selectedMagIds.length} magazine{selectedMagIds.length !== 1 ? 's' : ''} selected
                &middot; {totalPageCount} total pages
              </p>
            )}
          </div>
        )}

        {step === 'select' && sourceType === 'rolls' && (
          <div className="flex flex-col gap-[var(--space-element)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Select developed rolls. Each roll becomes a section in your book.
            </p>

            {rollsLoading ? (
              <div className="flex items-center justify-center py-[var(--space-section)]">
                <Spinner size="sm" />
              </div>
            ) : rolls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-element)]">
                <Wand2 size={32} className="text-[var(--color-ink-tertiary)]" />
                <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center">
                  No developed rolls yet. Develop some rolls first!
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-[var(--space-element)] max-h-[360px] overflow-y-auto">
                {rolls.map((roll) => {
                  const selIndex = selectedRollIds.indexOf(roll.id);
                  const isSelected = selIndex !== -1;
                  return (
                    <button
                      key={roll.id}
                      type="button"
                      onClick={() => toggleItem(roll.id)}
                      className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-colors min-h-[44px] text-left ${
                        isSelected
                          ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
                        {roll.cover_url ? (
                          <img
                            src={roll.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Wand2 size={16} className="text-[var(--color-ink-tertiary)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
                          {roll.theme_name || roll.title}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                          {roll.photo_count} photos &middot;{' '}
                          {new Date(roll.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[var(--color-action)]'
                            : 'border-2 border-[var(--color-border)]'
                        }`}
                      >
                        {isSelected && (
                          <span className="text-white text-[10px] font-bold font-[family-name:var(--font-mono)]">
                            {selIndex + 1}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedRollIds.length > 0 && (
              <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                {selectedRollIds.length} roll{selectedRollIds.length !== 1 ? 's' : ''} selected
                &middot; {totalPageCount} total photos
              </p>
            )}
          </div>
        )}

        {/* Step 4: Review */}
        {step === 'review' && (
          <div className="flex flex-col gap-[var(--space-component)]">
            {/* Cover preview */}
            <div className="relative aspect-[3/4] max-h-48 bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden mx-auto w-full max-w-[200px]">
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-surface-raised)] to-[var(--color-surface-sunken)]">
                <BookOpen size={32} className="text-[var(--color-ink-tertiary)]" />
              </div>
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

            {/* Chapter/section order */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <h3 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)]">
                {sourceType === 'magazines' ? 'Chapter Order' : 'Section Order'}
              </h3>
              <div className="flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                {sourceType === 'magazines'
                  ? selectedMagazines.map((mag, i) => (
                      <div
                        key={mag.id}
                        className="flex items-center gap-[var(--space-element)] p-1.5 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)]"
                      >
                        <GripVertical
                          size={14}
                          className="text-[var(--color-ink-tertiary)] flex-shrink-0"
                        />
                        <div className="w-8 h-10 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 bg-[var(--color-surface-sunken)] flex items-center justify-center">
                          <BookOpen size={12} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-medium truncate">
                            {mag.title}
                          </p>
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            {mag.page_count} pages
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveItem(i, 'up')}
                            disabled={i === 0}
                            className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(i, 'down')}
                            disabled={i === selectedMagazines.length - 1}
                            className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(mag.id)}
                            className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  : selectedRolls.map((roll, i) => (
                      <div
                        key={roll.id}
                        className="flex items-center gap-[var(--space-element)] p-1.5 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)]"
                      >
                        <GripVertical
                          size={14}
                          className="text-[var(--color-ink-tertiary)] flex-shrink-0"
                        />
                        <div className="w-10 h-10 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 bg-[var(--color-surface-sunken)]">
                          {roll.cover_url ? (
                            <img
                              src={roll.cover_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wand2 size={12} className="text-[var(--color-ink-tertiary)]" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-medium truncate">
                            {roll.theme_name || roll.title}
                          </p>
                          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                            {roll.photo_count} photos
                          </p>
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => moveItem(i, 'up')}
                            disabled={i === 0}
                            className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronLeft size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveItem(i, 'down')}
                            disabled={i === selectedRolls.length - 1}
                            className="p-1 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <ChevronRight size={14} className="rotate-90" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeItem(roll.id)}
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
              {sourceType === 'magazines'
                ? `${selectedMagIds.length} magazine${selectedMagIds.length !== 1 ? 's' : ''} · ${totalPageCount} total pages. Each magazine becomes a chapter.`
                : `${selectedRollIds.length} roll${selectedRollIds.length !== 1 ? 's' : ''} · ${totalPageCount} total photos. Each roll becomes a section.`}
            </p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between pt-[var(--space-tight)] border-t border-[var(--color-border)]">
          <div>
            {step !== 'template' && (
              <Button variant="ghost" size="sm" onClick={stepBack}>
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
              <Button variant="primary" size="sm" onClick={() => setStep('source')}>
                Next
                <ChevronRight size={16} className="ml-0.5" />
              </Button>
            )}
            {step === 'source' && (
              <Button variant="primary" size="sm" onClick={() => setStep('select')}>
                {sourceType === 'magazines' ? 'Select Magazines' : 'Select Rolls'}
                <ChevronRight size={16} className="ml-0.5" />
              </Button>
            )}
            {step === 'select' && (
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
