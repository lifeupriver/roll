'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight, ChevronLeft, Film, Check, Wand2, X, ShoppingCart, Type } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { TemplateSelector } from '@/components/magazine/TemplateSelector';
import {
  SpreadPageView,
  type DemoPage,
  type DemoLayout,
} from '@/components/magazine/SpreadPageView';
import { useToast } from '@/stores/toastStore';
import Image from 'next/image';
import type { MagazineTemplate, MagazineFormat } from '@/types/magazine';

interface DemoRoll {
  id: string;
  name: string;
  status: string;
  photo_count: number;
  max_photos: number;
  film_profile: string | null;
  created_at: string;
  coverUrl?: string;
  photos: string[];
}

type CreateStep = 'template' | 'rolls' | 'details' | 'generating' | 'preview';

// Layout patterns to apply to photos from rolls
const LAYOUT_SEQUENCE: DemoLayout[] = [
  'full_bleed',
  'two_up_vertical',
  'four_up_grid',
  'full_bleed',
  'two_up_horizontal',
  'three_up_top_heavy',
  'caption_heavy',
  'four_up_grid',
  'full_bleed',
];

const CAPTIONS = [
  'A moment worth remembering',
  'The light was perfect',
  'Weekend adventures',
  'Exploring the neighborhood',
  'Golden hour magic',
  'Simple joys',
  'The little things',
  'Just like that',
];

function photosNeeded(layout: DemoLayout): number {
  switch (layout) {
    case 'full_bleed':
      return 1;
    case 'caption_heavy':
      return 1;
    case 'two_up_vertical':
      return 2;
    case 'two_up_horizontal':
      return 2;
    case 'three_up_top_heavy':
      return 3;
    case 'four_up_grid':
      return 4;
    default:
      return 1;
  }
}

function generateMagazineFromRolls(rolls: DemoRoll[], title: string): DemoPage[] {
  const allPhotos = rolls.flatMap((r) => r.photos);
  if (allPhotos.length === 0) return [];

  const pages: DemoPage[] = [];
  let photoIndex = 0;

  // Cover page
  pages.push({
    layout: 'cover',
    photos: [allPhotos[photoIndex++ % allPhotos.length]],
    title: title || 'My Magazine',
    caption: rolls.map((r) => r.name).join(' + '),
  });

  // Generate content pages from the roll photos
  let layoutIndex = 0;
  let captionIndex = 0;

  // Add a section divider for the first roll
  if (rolls.length > 0) {
    pages.push({
      layout: 'section_divider',
      photos: [],
      title: rolls[0].name,
      caption: `${rolls[0].photo_count} photos`,
    });
  }

  let currentRollIdx = 0;
  let photosInCurrentRoll = 0;

  while (photoIndex < allPhotos.length && pages.length < 20) {
    const layout = LAYOUT_SEQUENCE[layoutIndex % LAYOUT_SEQUENCE.length];
    const needed = photosNeeded(layout);

    // Check if we have enough photos
    if (photoIndex + needed > allPhotos.length) break;

    const pagePhotos: string[] = [];
    for (let i = 0; i < needed; i++) {
      pagePhotos.push(allPhotos[photoIndex++ % allPhotos.length]);
      photosInCurrentRoll++;
    }

    // Check if we've moved to a new roll
    if (rolls.length > 1 && currentRollIdx < rolls.length - 1) {
      const currentRollTotal = rolls[currentRollIdx].photos.length;
      if (photosInCurrentRoll >= currentRollTotal) {
        currentRollIdx++;
        photosInCurrentRoll = 0;
        // Add section divider for new roll
        pages.push({
          layout: 'section_divider',
          photos: [],
          title: rolls[currentRollIdx].name,
          caption: `${rolls[currentRollIdx].photo_count} photos`,
        });
      }
    }

    pages.push({
      layout,
      photos: pagePhotos,
      caption: layoutIndex % 2 === 0 ? CAPTIONS[captionIndex++ % CAPTIONS.length] : undefined,
    });

    layoutIndex++;
  }

  return pages;
}

export default function CreateMagazinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRollId = searchParams.get('rollId');
  const { toast } = useToast();
  const [step, setStep] = useState<CreateStep>(preselectedRollId ? 'rolls' : 'template');
  const [template, setTemplate] = useState<MagazineTemplate | null>(
    preselectedRollId ? 'monthly' : null
  );
  const [title, setTitle] = useState('');
  const [format, setFormat] = useState<MagazineFormat>('6x9');
  const [_creating, setCreating] = useState(false);

  // Roll selection state
  const [availableRolls, setAvailableRolls] = useState<DemoRoll[]>([]);
  const [selectedRollIds, setSelectedRollIds] = useState<Set<string>>(
    new Set(preselectedRollId ? [preselectedRollId] : [])
  );
  const [rollsLoading, setRollsLoading] = useState(false);
  const [autoAdvanced, setAutoAdvanced] = useState(false);

  // Generated magazine preview
  const [generatedPages, setGeneratedPages] = useState<DemoPage[]>([]);
  const [spreadIndex, setSpreadIndex] = useState(0);

  // Load available rolls
  useEffect(() => {
    async function fetchRolls() {
      setRollsLoading(true);
      try {
        const res = await fetch('/api/rolls');
        if (res.ok) {
          const { data } = await res.json();
          // Filter to eligible rolls first, then fetch details in parallel
          const eligible = (data ?? []).filter(
            (roll: { status: string; photo_count: number }) =>
              (roll.status === 'developed' ||
                roll.status === 'building' ||
                roll.status === 'ready') &&
              roll.photo_count > 0
          );

          const detailResults = await Promise.allSettled(
            eligible.map((roll: { id: string }) =>
              fetch(`/api/rolls/${roll.id}`).then((r) => (r.ok ? r.json() : null))
            )
          );

          const rolls: DemoRoll[] = [];
          detailResults.forEach((result, i) => {
            if (result.status !== 'fulfilled' || !result.value) return;
            const roll = eligible[i];
            const photos = (result.value.data?.photos ?? [])
              .map(
                (p: { processed_storage_key?: string; photos?: { thumbnail_url?: string } }) =>
                  p.processed_storage_key || p.photos?.thumbnail_url || ''
              )
              .filter(Boolean);
            rolls.push({
              id: roll.id,
              name: roll.name || 'Untitled Roll',
              status: roll.status,
              photo_count: roll.photo_count,
              max_photos: roll.max_photos,
              film_profile: roll.film_profile,
              created_at: roll.created_at,
              coverUrl: photos[0] || '',
              photos,
            });
          });
          setAvailableRolls(rolls);
        }
      } catch {
        // Non-critical
      } finally {
        setRollsLoading(false);
      }
    }
    fetchRolls();
  }, []);

  // Auto-advance to details when pre-selected roll is found
  useEffect(() => {
    if (preselectedRollId && !autoAdvanced && availableRolls.length > 0) {
      const found = availableRolls.find((r) => r.id === preselectedRollId);
      if (found) {
        setSelectedRollIds(new Set([preselectedRollId]));
        setTitle(found.name || '');
        setStep('details');
        setAutoAdvanced(true);
      }
    }
  }, [preselectedRollId, availableRolls, autoAdvanced]);

  const toggleRoll = (rollId: string) => {
    setSelectedRollIds((prev) => {
      const next = new Set(prev);
      if (next.has(rollId)) {
        next.delete(rollId);
      } else {
        next.add(rollId);
      }
      return next;
    });
  };

  const handleGenerate = () => {
    const selectedRolls = availableRolls.filter((r) => selectedRollIds.has(r.id));
    if (selectedRolls.length === 0) {
      toast('Please select at least one roll', 'error');
      return;
    }

    setStep('generating');
    setCreating(true);

    // Simulate generation with a brief delay
    setTimeout(() => {
      const magazineTitle = title.trim() || selectedRolls.map((r) => r.name).join(' + ');
      const pages = generateMagazineFromRolls(selectedRolls, magazineTitle);
      setGeneratedPages(pages);
      setSpreadIndex(0);
      setCreating(false);
      setStep('preview');
    }, 1500);
  };

  const handleCreate = async () => {
    if (!template) {
      toast('Please select a template', 'error');
      return;
    }

    setStep('generating');
    setCreating(true);

    try {
      const res = await fetch('/api/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || `${template.charAt(0).toUpperCase() + template.slice(1)} Magazine`,
          template,
          format,
          rollIds: Array.from(selectedRollIds),
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to create magazine');
      }

      const json = await res.json();
      if (!json.data?.id) {
        throw new Error('Magazine was created but no ID was returned');
      }
      toast('Magazine created!', 'success');
      router.push(`/projects/magazines/${json.data.id}`);
    } catch (err) {
      setCreating(false);
      // Network failure (fetch itself threw) — fall back to local preview generation
      if (err instanceof TypeError) {
        handleGenerate();
        return;
      }
      // API returned an error — surface it and let the user retry
      setStep('details');
      toast(err instanceof Error ? err.message : 'Failed to create magazine', 'error');
    }
  };

  const allSteps: CreateStep[] = ['template', 'rolls', 'details', 'generating', 'preview'];
  const currentStepIndex = allSteps.indexOf(step);

  const totalSpreads = Math.ceil(generatedPages.length / 2);
  const leftIndex = spreadIndex * 2;
  const rightIndex = spreadIndex * 2 + 1;
  const leftPage = generatedPages[leftIndex] ?? null;
  const rightPage = generatedPages[rightIndex] ?? null;
  const font = '-apple-system, BlinkMacSystemFont, sans-serif';

  return (
    <div className="flex flex-col gap-[var(--space-section)] max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton />
        <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-heading)] text-[var(--color-ink)]">
          New Magazine
        </h1>
      </div>

      {/* Step indicator */}
      {step !== 'preview' && (
        <div className="flex items-center gap-2">
          {['template', 'rolls', 'details'].map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s === step
                  ? 'bg-[var(--color-action)]'
                  : currentStepIndex > i
                    ? 'bg-[var(--color-action)]/40'
                    : 'bg-[var(--color-border)]'
              }`}
            />
          ))}
        </div>
      )}

      {/* Step 1: Template */}
      {step === 'template' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Choose a template for your magazine. We&apos;ll auto-design it from your rolls.
          </p>
          <TemplateSelector selected={template} onSelect={setTemplate} />
          <div className="flex justify-end pt-[var(--space-element)]">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('rolls')}
              disabled={!template}
            >
              Next
              <ChevronRight size={16} className="ml-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Rolls */}
      {step === 'rolls' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-tight)]">
              Select Rolls
            </h2>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
              Choose one or more rolls to build your magazine from. We&apos;ll use their photos to
              auto-design the layout.
            </p>
          </div>

          {rollsLoading ? (
            <div className="flex items-center justify-center py-[var(--space-section)]">
              <Spinner size="md" />
            </div>
          ) : availableRolls.length === 0 ? (
            <div className="flex flex-col items-center py-[var(--space-section)] gap-[var(--space-element)] text-center">
              <Film size={32} className="text-[var(--color-ink-tertiary)]" />
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
                No rolls available yet. Build and develop a roll first.
              </p>
              <Button variant="secondary" size="sm" onClick={() => router.push('/feed')}>
                Go to Photos
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-[var(--space-element)]">
              {availableRolls.map((roll) => {
                const isSelected = selectedRollIds.has(roll.id);
                return (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => toggleRoll(roll.id)}
                    className={`flex items-center gap-[var(--space-component)] w-full text-left rounded-[var(--radius-card)] border-2 p-[var(--space-element)] transition-all ${
                      isSelected
                        ? 'border-[var(--color-action)] bg-[var(--color-action)]/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'
                    }`}
                  >
                    {/* Roll cover */}
                    <div className="relative w-16 h-[85px] bg-[var(--color-surface-sunken)] rounded-[var(--radius-sharp)] overflow-hidden shrink-0">
                      {roll.coverUrl ? (
                        <Image
                          src={roll.coverUrl}
                          alt=""
                          fill
                          className="object-cover"
                          loading="lazy"
                          unoptimized
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Film size={18} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-[var(--color-action)]/30 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-[var(--color-action)] flex items-center justify-center">
                            <Check size={14} className="text-white" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Roll info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)] truncate">
                        {roll.name}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                        {roll.photo_count} photos
                        {roll.status === 'developed' && ' · Developed'}
                        {roll.status === 'building' && ' · Building'}
                        {roll.status === 'ready' && ' · Ready'}
                      </p>
                    </div>

                    {/* Photo preview strip */}
                    <div className="flex -space-x-2">
                      {roll.photos.slice(0, 4).map((photo, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full overflow-hidden border-2 border-[var(--color-surface)] shrink-0"
                        >
                          <Image
                            src={photo}
                            alt=""
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized
                          />
                        </div>
                      ))}
                      {roll.photos.length > 4 && (
                        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-sunken)] border-2 border-[var(--color-surface)] flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-medium text-[var(--color-ink-tertiary)]">
                            +{roll.photos.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {selectedRollIds.size > 0 && (
            <p className="text-[length:var(--text-caption)] text-[var(--color-action)] font-medium">
              {selectedRollIds.size} roll{selectedRollIds.size !== 1 ? 's' : ''} selected ·{' '}
              {availableRolls
                .filter((r) => selectedRollIds.has(r.id))
                .reduce((sum, r) => sum + r.photos.length, 0)}{' '}
              photos total
            </p>
          )}

          <div className="flex items-center justify-between pt-[var(--space-element)]">
            <Button variant="ghost" size="sm" onClick={() => setStep('template')}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setStep('details')}
              disabled={selectedRollIds.size === 0}
            >
              Next
              <ChevronRight size={16} className="ml-0.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Details */}
      {step === 'details' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <Input
            label="Magazine Title"
            placeholder="February 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />

          <div className="flex flex-col gap-[var(--space-tight)]">
            <label className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] tracking-[0.04em] uppercase text-[var(--color-ink-secondary)]">
              Format
            </label>
            <div className="flex gap-2">
              {(['6x9', '8x10'] as MagazineFormat[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFormat(f)}
                  className={`flex-1 py-2 rounded-[var(--radius-sharp)] border-2 font-[family-name:var(--font-mono)] text-[length:var(--text-body)] transition-colors ${
                    format === f
                      ? 'border-[var(--color-action)] bg-[var(--color-action)]/5 text-[var(--color-ink)]'
                      : 'border-[var(--color-border)] text-[var(--color-ink-secondary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Selected rolls summary */}
          <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-[var(--space-element)] bg-[var(--color-surface-raised)]">
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] font-medium uppercase tracking-wider mb-[var(--space-tight)]">
              Source rolls
            </p>
            <div className="flex flex-wrap gap-[var(--space-tight)]">
              {availableRolls
                .filter((r) => selectedRollIds.has(r.id))
                .map((roll) => (
                  <span
                    key={roll.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-pill)] bg-[var(--color-action)]/10 text-[length:var(--text-caption)] text-[var(--color-action)] font-medium"
                  >
                    <Film size={10} />
                    {roll.name}
                  </span>
                ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-[var(--space-element)]">
            <Button variant="ghost" size="sm" onClick={() => setStep('rolls')}>
              Back
            </Button>
            <Button variant="primary" size="sm" onClick={handleCreate}>
              <Wand2 size={14} className="mr-1" />
              Create Magazine
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generating */}
      {step === 'generating' && (
        <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-component)]">
          <Spinner size="lg" />
          <p className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] text-[var(--color-ink)]">
            Designing your magazine...
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Auto-selecting photos and laying out pages from your rolls.
          </p>
        </div>
      )}

      {/* Step 5: Magazine Preview */}
      {step === 'preview' && generatedPages.length > 0 && (
        <div className="flex flex-col gap-[var(--space-component)]">
          {/* Success header */}
          <div className="flex items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] bg-[var(--color-action)]/10 border border-[var(--color-action)]/20">
            <Wand2 size={20} className="text-[var(--color-action)] shrink-0" />
            <div>
              <p className="text-[length:var(--text-body)] font-medium text-[var(--color-ink)]">
                Magazine designed!
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {generatedPages.length} pages from {selectedRollIds.size} roll
                {selectedRollIds.size !== 1 ? 's' : ''} · {format}
              </p>
            </div>
          </div>

          {/* Spread viewer */}
          <div className="flex gap-0 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] w-full">
            <SpreadPageView page={leftPage} pageIndex={leftIndex} font={font} />
            <div className="w-[2px] bg-[var(--color-border-strong)] flex-shrink-0 z-10" />
            <SpreadPageView page={rightPage} pageIndex={rightIndex} font={font} />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setSpreadIndex(Math.max(0, spreadIndex - 1))}
              disabled={spreadIndex === 0}
              className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              {leftIndex + 1}–{Math.min(rightIndex + 1, generatedPages.length)} of{' '}
              {generatedPages.length}
            </span>
            <button
              type="button"
              onClick={() => setSpreadIndex(Math.min(totalSpreads - 1, spreadIndex + 1))}
              disabled={spreadIndex >= totalSpreads - 1}
              className="p-2 rounded-[var(--radius-sharp)] bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-surface-sunken)] transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Thumbnail strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {Array.from({ length: totalSpreads }, (_, i) => {
              const page = generatedPages[i * 2];
              const photoUrl = page?.photos[0];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSpreadIndex(i)}
                  className={`flex-shrink-0 w-14 h-10 rounded overflow-hidden border-2 transition-colors ${
                    i === spreadIndex
                      ? 'border-[var(--color-action)]'
                      : 'border-transparent hover:border-[var(--color-border)]'
                  }`}
                >
                  {photoUrl ? (
                    <Image
                      src={photoUrl}
                      alt=""
                      width={56}
                      height={40}
                      className="w-full h-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
                      <Type size={8} className="text-[var(--color-ink-tertiary)]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-[var(--space-element)] border-t border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                Estimated price:
              </span>
              <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-body)] text-[var(--color-ink)]">
                $14.99
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStep('rolls');
                  setGeneratedPages([]);
                }}
              >
                <X size={14} className="mr-1" /> Start Over
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  setCreating(true);
                  try {
                    const res = await fetch('/api/magazines', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        title: title.trim() || 'My Magazine',
                        template: template || 'monthly',
                        format,
                        rollIds: Array.from(selectedRollIds),
                      }),
                    });
                    if (res.ok) {
                      const json = await res.json();
                      if (json.data?.id) {
                        router.push(`/projects/magazines/${json.data.id}/review`);
                        return;
                      }
                    }
                    // Fallback: navigate to designs listing
                    toast('Magazine saved!', 'success');
                    router.push('/designs');
                  } catch {
                    toast('Magazine saved!', 'success');
                    router.push('/designs');
                  } finally {
                    setCreating(false);
                  }
                }}
              >
                <ShoppingCart size={14} className="mr-1" /> Order Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
