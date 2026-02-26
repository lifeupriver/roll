'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Check, Book } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FontSelector } from '@/components/magazine/FontSelector';
import { useToast } from '@/stores/toastStore';
import { useRouter } from 'next/navigation';
import type { MagazineFont } from '@/types/magazine';

interface MagazineForSelection {
  id: string;
  title: string;
  date_range_start: string | null;
  date_range_end: string | null;
  page_count: number;
  cover_url: string | null;
}

export function BookCreator() {
  const { toast } = useToast();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [magazines, setMagazines] = useState<MagazineForSelection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedMagIds, setSelectedMagIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<'8x10' | '10x10'>('8x10');
  const [font, setFont] = useState<MagazineFont>('default');
  const [isPublic, setIsPublic] = useState(false);

  useEffect(() => {
    async function fetchMagazines() {
      try {
        const res = await fetch('/api/magazines');
        if (res.ok) {
          const { data } = await res.json();
          setMagazines(
            (data || []).map((m: Record<string, unknown>) => ({
              id: m.id as string,
              title: (m.title as string) || 'Untitled',
              date_range_start: m.date_range_start as string | null,
              date_range_end: m.date_range_end as string | null,
              page_count: (m.page_count as number) || 0,
              cover_url: m.cover_url as string | null,
            }))
          );
        }
      } catch {
        toast('Failed to load magazines', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchMagazines();
  }, [toast]);

  const toggleMagazine = (id: string) => {
    setSelectedMagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalPages = magazines
    .filter((m) => selectedMagIds.includes(m.id))
    .reduce((sum, m) => sum + m.page_count, 0);

  const handleCreate = async () => {
    if (!title.trim() || selectedMagIds.length === 0) return;
    setCreating(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          magazineIds: selectedMagIds,
          format,
          font,
          isPublic,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        toast('Book created!', 'success');
        router.push(`/projects/books/${data.id}`);
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to create book', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-[var(--space-section)]">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--color-action)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center gap-[var(--space-element)] mb-[var(--space-section)]">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1 rounded-full ${
              s <= step ? 'bg-[var(--color-action)]' : 'bg-[var(--color-border)]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Select Magazines */}
      {step === 1 && (
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-element)]">
            Select Magazines
          </h2>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-component)]">
            {selectedMagIds.length} selected &middot; {totalPages} pages
          </p>

          <div className="flex flex-col gap-[var(--space-element)]">
            {magazines.map((mag) => {
              const isSelected = selectedMagIds.includes(mag.id);
              return (
                <button
                  key={mag.id}
                  type="button"
                  onClick={() => toggleMagazine(mag.id)}
                  className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-colors min-h-[44px] text-left ${
                    isSelected
                      ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                      : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                  }`}
                >
                  <div className="w-10 h-14 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0 flex items-center justify-center">
                    {mag.cover_url ? (
                      <img src={mag.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Book size={16} className="text-[var(--color-ink-tertiary)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[length:var(--text-body)] text-[var(--color-ink)] font-medium truncate">
                      {mag.title}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {mag.page_count} pages
                    </p>
                  </div>
                  <div
                    className={`w-6 h-6 rounded-[var(--radius-sharp)] border-2 flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-[var(--color-action)] border-[var(--color-action)]'
                        : 'border-[var(--color-border)]'
                    }`}
                  >
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-end mt-[var(--space-component)]">
            <Button
              variant="primary"
              onClick={() => setStep(2)}
              disabled={selectedMagIds.length === 0}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Book Details */}
      {step === 2 && (
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-component)]">
            Book Details
          </h2>

          <div className="flex flex-col gap-[var(--space-component)]">
            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-micro)] block">
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                placeholder="2025: A Year in Photos"
                className="w-full bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                maxLength={200}
              />
            </div>

            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
                Format
              </label>
              <div className="flex gap-[var(--space-element)]">
                {(['8x10', '10x10'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`flex-1 p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-colors text-center min-h-[44px] ${
                      format === f
                        ? 'border-[var(--color-action)] bg-[var(--color-surface-raised)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)]'
                    }`}
                  >
                    <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                      {f === '8x10' ? '8×10 Hardcover' : '10×10 Hardcover'}
                    </p>
                    <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {f === '8x10' ? 'From $39.99' : 'From $49.99'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
                Font
              </label>
              <FontSelector selectedFont={font} onFontChange={setFont} sampleTitle={title || 'My Book'} />
            </div>

            <label className="flex items-center gap-[var(--space-element)] min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsPublic(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-action)] rounded"
              />
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink)]">
                Make available on my public page
              </span>
            </label>
          </div>

          <div className="flex justify-between mt-[var(--space-component)]">
            <Button variant="ghost" onClick={() => setStep(1)}>
              <ChevronLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={() => setStep(3)} disabled={!title.trim()}>
              Preview <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Create */}
      {step === 3 && (
        <div>
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] mb-[var(--space-component)]">
            Review Your Book
          </h2>

          <div className="bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] p-[var(--space-component)] mb-[var(--space-component)]">
            <dl className="flex flex-col gap-[var(--space-element)]">
              <div className="flex justify-between">
                <dt className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Title</dt>
                <dd className="text-[length:var(--text-caption)] text-[var(--color-ink)] font-medium">{title}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Format</dt>
                <dd className="text-[length:var(--text-caption)] text-[var(--color-ink)]">{format} Hardcover</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Magazines</dt>
                <dd className="text-[length:var(--text-caption)] text-[var(--color-ink)]">{selectedMagIds.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Est. pages</dt>
                <dd className="text-[length:var(--text-caption)] text-[var(--color-ink)]">~{totalPages + 4}</dd>
              </div>
            </dl>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft size={16} /> Back
            </Button>
            <Button variant="primary" onClick={handleCreate} isLoading={creating}>
              Create Book
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
