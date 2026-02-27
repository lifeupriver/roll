'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Film,
  Wand2,
  BookOpen,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { BackButton } from '@/components/ui/BackButton';
import { EssayTemplateSelector } from '@/components/blog/EssayTemplateSelector';
import { EssayFontSelector } from '@/components/blog/EssayFontSelector';
import { PostBlockEditor } from '@/components/blog/PostBlockEditor';
import { BlogPhotoLayout } from '@/components/blog/BlogPhotoLayout';
import { useToast } from '@/stores/toastStore';
import { smartDesignBlogWithTemplate } from '@/lib/design/design-engine';
import type { BlogBlock } from '@/lib/design/design-engine';
import type { EssayTemplate, EssayFont } from '@/types/blog';

type WizardStep = 'template' | 'rolls' | 'details' | 'designing' | 'preview';

interface RollForSelection {
  id: string;
  name: string | null;
  photo_count: number;
  status: string;
  created_at: string;
  cover_url: string | null;
  story: string | null;
}

interface RollPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
  aesthetic_score: number | null;
  face_count: number | null;
  scene_classification: string[];
}

interface RollReel {
  id: string;
  thumbnail_url: string;
  video_url: string;
  width: number;
  height: number;
  caption: string | null;
  duration_ms: number | null;
}

export default function CreateEssayPage() {
  const router = useRouter();
  const { toast } = useToast();

  // Wizard state
  const [step, setStep] = useState<WizardStep>('template');
  const [essayTemplate, setEssayTemplate] = useState<EssayTemplate | null>(null);
  const [selectedRollIds, setSelectedRollIds] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [font, setFont] = useState<EssayFont>('default');
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);

  // Data
  const [rolls, setRolls] = useState<RollForSelection[]>([]);
  const [rollPhotos, setRollPhotos] = useState<RollPhoto[]>([]);
  const [rollReels, setRollReels] = useState<RollReel[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch available rolls
  useEffect(() => {
    async function fetchRolls() {
      try {
        const res = await fetch('/api/rolls?status=developed');
        if (res.ok) {
          const json = await res.json();
          setRolls(json.data ?? []);
        }
      } catch {
        // Silently handle
      }
    }
    fetchRolls();
  }, []);

  // Fetch photos for selected rolls when moving to design step
  const fetchRollMedia = useCallback(async () => {
    if (selectedRollIds.length === 0) return;
    setLoading(true);
    try {
      const photoPromises = selectedRollIds.map(async (rollId) => {
        const res = await fetch(`/api/rolls/${rollId}/photos`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data ?? []).map((rp: Record<string, unknown>) => ({
          id: rp.photo_id || rp.id,
          thumbnail_url: (rp.photos as Record<string, unknown>)?.thumbnail_url || rp.thumbnail_url || '',
          developed_url: (rp.photos as Record<string, unknown>)?.developed_url || rp.developed_url || '',
          width: (rp.photos as Record<string, unknown>)?.width || rp.width || 1200,
          height: (rp.photos as Record<string, unknown>)?.height || rp.height || 800,
          caption: (rp.photos as Record<string, unknown>)?.caption || rp.caption || null,
          aesthetic_score: (rp.photos as Record<string, unknown>)?.aesthetic_score || rp.aesthetic_score || null,
          face_count: (rp.photos as Record<string, unknown>)?.face_count || rp.face_count || null,
          scene_classification: ((rp.photos as Record<string, unknown>)?.scene_classification || rp.scene_classification || []) as string[],
        }));
      });

      const allPhotos = (await Promise.all(photoPromises)).flat();
      setRollPhotos(allPhotos);
    } catch {
      toast('Failed to load photos', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedRollIds, toast]);

  // Auto-design when moving to design step
  const runAutoDesign = useCallback(() => {
    if (!essayTemplate || rollPhotos.length === 0) return;

    // Combine story from selected rolls
    const selectedRolls = rolls.filter(r => selectedRollIds.includes(r.id));
    const combinedStory = story || selectedRolls.map(r => r.story).filter(Boolean).join('\n\n') || '';

    const mediaItems = [
      ...rollPhotos.map(p => ({
        id: p.id,
        type: 'photo' as const,
        width: p.width,
        height: p.height,
        caption: p.caption,
        aesthetic_score: p.aesthetic_score,
        face_count: p.face_count,
        scene_classification: p.scene_classification,
        duration_ms: null,
      })),
      ...rollReels.map(v => ({
        id: v.id,
        type: 'video' as const,
        width: v.width,
        height: v.height,
        caption: v.caption,
        aesthetic_score: null,
        face_count: null,
        scene_classification: [] as string[],
        duration_ms: v.duration_ms,
      })),
    ];

    const designed = smartDesignBlogWithTemplate(mediaItems, essayTemplate, combinedStory || undefined);
    setBlocks(designed);
  }, [essayTemplate, rollPhotos, rollReels, story, rolls, selectedRollIds]);

  // Photo and video maps for rendering
  const photoMap = useMemo(() => {
    const map = new Map<string, RollPhoto>();
    for (const p of rollPhotos) map.set(p.id, p);
    return map;
  }, [rollPhotos]);

  const videoMap = useMemo(() => {
    const map = new Map<string, RollReel>();
    for (const v of rollReels) map.set(v.id, v);
    return map;
  }, [rollReels]);

  // Toggle roll selection
  const toggleRoll = (rollId: string) => {
    setSelectedRollIds((prev) =>
      prev.includes(rollId)
        ? prev.filter((id) => id !== rollId)
        : prev.length < 6 ? [...prev, rollId] : prev
    );
  };

  // Step navigation
  const goToDesigning = async () => {
    setStep('designing');
    await fetchRollMedia();
    // Small delay for generating animation
    setTimeout(() => {
      runAutoDesign();
      setStep('preview');
    }, 1200);
  };

  // Create blog post
  const handleCreate = async () => {
    if (!essayTemplate || selectedRollIds.length === 0 || !title.trim()) return;
    setCreating(true);
    try {
      // Create the post via API
      const primaryRollId = selectedRollIds[0];
      const additionalRollIds = selectedRollIds.slice(1);

      const res = await fetch('/api/blog/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId: primaryRollId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast(err.error || 'Failed to create post', 'error');
        return;
      }

      const { data: post } = await res.json();

      // Update with essay details
      const updateRes = await fetch(`/api/blog/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: story ? story.split(/[.!?]/)[0]?.trim() || null : null,
          essay_template: essayTemplate,
          essay_font: font,
          essay_blocks: JSON.stringify(blocks),
          roll_ids: additionalRollIds,
        }),
      });

      if (updateRes.ok) {
        toast('Photo essay designed!', 'success');
        router.push(`/projects/posts/${post.id}`);
      } else {
        // Even if update fails, navigate to the post
        toast('Essay created with default settings', 'info');
        router.push(`/projects/posts/${post.id}`);
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setCreating(false);
    }
  };

  // Selected rolls info
  const selectedRolls = rolls.filter(r => selectedRollIds.includes(r.id));
  const totalPhotos = selectedRolls.reduce((sum, r) => sum + (r.photo_count || 0), 0);

  // Step indicators
  const steps: { key: WizardStep; label: string }[] = [
    { key: 'template', label: 'Style' },
    { key: 'rolls', label: 'Rolls' },
    { key: 'details', label: 'Details' },
    { key: 'preview', label: 'Preview' },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step || (step === 'designing' && s.key === 'preview'));

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-[var(--space-hero)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton href="/designs" />
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
          New Photo Essay
        </h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-[var(--space-tight)]">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-[var(--space-tight)]">
            <div
              className={`flex items-center gap-[var(--space-tight)] px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                i < currentStepIndex
                  ? 'bg-[var(--color-developed)]/10 text-[var(--color-developed)]'
                  : i === currentStepIndex
                    ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]'
              }`}
            >
              {i < currentStepIndex ? <Check size={12} /> : null}
              {s.label}
            </div>
            {i < steps.length - 1 && (
              <ChevronRight size={12} className="text-[var(--color-ink-tertiary)]" />
            )}
          </div>
        ))}
      </div>

      {/* ─── Step 1: Template Selection ─── */}
      {step === 'template' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-tight)]">
              Choose an essay style
            </h2>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Each style has a unique editorial rhythm that determines how your photos, text, and quotes are arranged.
            </p>
          </div>

          <EssayTemplateSelector
            selected={essayTemplate}
            onSelect={setEssayTemplate}
          />

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setStep('rolls')}
              disabled={!essayTemplate}
            >
              Next: Select Rolls <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 2: Roll Selection ─── */}
      {step === 'rolls' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-tight)]">
              Select your rolls
            </h2>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              Choose up to 6 developed rolls to include in your photo essay.
              {selectedRollIds.length > 0 && (
                <span className="ml-1 font-medium text-[var(--color-action)]">
                  {selectedRollIds.length} selected · {totalPhotos} photos
                </span>
              )}
            </p>
          </div>

          {rolls.length === 0 ? (
            <div className="text-center py-[var(--space-section)]">
              <Film size={32} className="mx-auto mb-[var(--space-element)] text-[var(--color-ink-tertiary)]" />
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
                No developed rolls available yet.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.push('/photos')}
                className="mt-[var(--space-element)]"
              >
                Go to Photos
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-[var(--space-element)]">
              {rolls.map((roll) => {
                const isSelected = selectedRollIds.includes(roll.id);
                const selectionIndex = selectedRollIds.indexOf(roll.id);
                return (
                  <button
                    key={roll.id}
                    type="button"
                    onClick={() => toggleRoll(roll.id)}
                    disabled={!isSelected && selectedRollIds.length >= 6}
                    className={`flex items-center gap-[var(--space-element)] p-[var(--space-element)] rounded-[var(--radius-card)] border-2 transition-all text-left ${
                      isSelected
                        ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-border-focus)] disabled:opacity-40'
                    }`}
                  >
                    {/* Cover */}
                    <div className="w-16 h-20 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] shrink-0">
                      {roll.cover_url ? (
                        <img src={roll.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Film size={20} className="text-[var(--color-ink-tertiary)]" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)] truncate">
                        {roll.name || 'Untitled Roll'}
                      </p>
                      <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                        {roll.photo_count} photos
                      </p>
                      {roll.story && (
                        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] truncate mt-0.5 italic">
                          {roll.story.slice(0, 80)}...
                        </p>
                      )}
                    </div>

                    {/* Selection indicator */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-action)] text-white'
                          : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-tertiary)]'
                      }`}
                    >
                      {isSelected ? (
                        <span className="text-[length:var(--text-caption)] font-bold">{selectionIndex + 1}</span>
                      ) : (
                        <Check size={14} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep('template')}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep('details')}
              disabled={selectedRollIds.length === 0}
            >
              Next: Details <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 3: Details ─── */}
      {step === 'details' && (
        <div className="flex flex-col gap-[var(--space-component)]">
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-tight)]">
              Essay details
            </h2>
          </div>

          {/* Title */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your photo essay a title..."
              className="w-full h-12 px-[var(--space-element)] text-[length:var(--text-lead)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] font-[family-name:var(--font-display)] focus:outline-none focus:border-[var(--color-border-focus)]"
              maxLength={200}
            />
          </div>

          {/* Story */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-tight)] block">
              Story (optional)
            </label>
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="Write the story behind these photos. Use blank lines to separate paragraphs — they'll be woven between your images..."
              className="w-full h-40 px-[var(--space-element)] py-[var(--space-element)] text-[length:var(--text-body)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-card)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)] resize-none leading-relaxed"
              maxLength={5000}
            />
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
              {story.length}/5000 · Separate paragraphs with blank lines for better interleaving.
            </p>
          </div>

          {/* Font */}
          <div>
            <label className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em] mb-[var(--space-element)] block">
              Typography
            </label>
            <EssayFontSelector selected={font} onSelect={setFont} />
          </div>

          {/* Summary */}
          <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] border border-[var(--color-border)]">
            <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-label)] text-[var(--color-ink)] mb-[var(--space-tight)]">
              Summary
            </h3>
            <div className="flex flex-wrap gap-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
              <span className="capitalize">{essayTemplate} style</span>
              <span>&middot;</span>
              <span>{selectedRollIds.length} roll{selectedRollIds.length !== 1 ? 's' : ''}</span>
              <span>&middot;</span>
              <span>{totalPhotos} photos</span>
              {story && (
                <>
                  <span>&middot;</span>
                  <span>{story.split(/\n\n+/).filter(p => p.trim()).length} paragraphs</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep('rolls')}>
              <ChevronLeft size={16} className="mr-1" /> Back
            </Button>
            <Button
              variant="primary"
              onClick={goToDesigning}
              disabled={!title.trim()}
            >
              <Wand2 size={16} className="mr-1" /> Design Essay
            </Button>
          </div>
        </div>
      )}

      {/* ─── Step 4: Designing (animation) ─── */}
      {step === 'designing' && (
        <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
          <style>{`
            @keyframes essay-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
            .essay-pulse { animation: essay-pulse 1.5s ease-in-out infinite; }
          `}</style>
          <Wand2 size={48} strokeWidth={1.5} className="essay-pulse text-[var(--color-action)]" />
          <p className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] text-[var(--color-ink)]">
            Designing your photo essay...
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Analyzing {totalPhotos} photos and composing the perfect layout
          </p>
        </div>
      )}

      {/* ─── Step 5: Preview + Edit ─── */}
      {step === 'preview' && (
        <div className="flex flex-col gap-[var(--space-section)]">
          {/* Success header */}
          <div className="bg-[var(--color-developed)]/10 rounded-[var(--radius-card)] p-[var(--space-component)] flex items-center gap-[var(--space-element)]">
            <div className="w-10 h-10 rounded-full bg-[var(--color-developed)] flex items-center justify-center shrink-0">
              <Check size={20} className="text-white" />
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                Essay designed!
              </p>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {blocks.length} content blocks · {blocks.filter(b => b.photoIds.length > 0).length} photo sections ·{' '}
                {blocks.filter(b => b.type === 'text').length} text sections
              </p>
            </div>
          </div>

          {/* Two-column layout: editor + preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--space-section)]">
            {/* Left: Block editor */}
            <div className="order-2 lg:order-1">
              <PostBlockEditor
                blocks={blocks}
                photoMap={photoMap as unknown as Map<string, { thumbnail_url: string; caption: string | null }>}
                videoMap={videoMap as unknown as Map<string, { thumbnail_url: string; caption: string | null }>}
                onBlocksChange={setBlocks}
              />

              {/* Re-design button */}
              <div className="mt-[var(--space-component)] flex items-center gap-[var(--space-element)]">
                <Button variant="ghost" size="sm" onClick={() => { runAutoDesign(); toast('Re-designed!', 'success'); }}>
                  <Wand2 size={14} className="mr-1" /> Re-design
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setStep('details')}>
                  <ChevronLeft size={14} className="mr-1" /> Edit Details
                </Button>
              </div>
            </div>

            {/* Right: Live preview */}
            <div className="order-1 lg:order-2">
              <div className="sticky top-20">
                <div className="flex items-center gap-[var(--space-tight)] mb-[var(--space-element)]">
                  <Eye size={14} className="text-[var(--color-ink-tertiary)]" />
                  <span className="text-[length:var(--text-caption)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
                    Preview
                  </span>
                </div>
                <div className="border border-[var(--color-border)] rounded-[var(--radius-card)] p-[var(--space-component)] bg-[var(--color-surface)] max-h-[70vh] overflow-y-auto">
                  {/* Title preview */}
                  <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] leading-tight mb-[var(--space-component)]">
                    {title || 'Untitled Essay'}
                  </h2>

                  <BlogPhotoLayout
                    blocks={blocks}
                    photoMap={photoMap as unknown as Map<string, { id: string; thumbnail_url: string; developed_url: string; width: number; height: number; caption: string | null }>}
                    videoMap={videoMap as unknown as Map<string, { id: string; thumbnail_url: string; video_url: string; width: number; height: number; caption: string | null; duration_ms: number | null }>}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-[var(--space-component)] border-t border-[var(--color-border)]">
            <Button variant="ghost" onClick={() => setStep('details')}>
              <ChevronLeft size={16} className="mr-1" /> Back to Details
            </Button>
            <div className="flex items-center gap-[var(--space-element)]">
              <Button
                variant="primary"
                onClick={handleCreate}
                isLoading={creating}
                disabled={!title.trim() || blocks.length === 0}
              >
                <BookOpen size={16} className="mr-1" /> Create Essay
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
