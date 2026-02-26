'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { VoiceCaptionButton } from '@/components/shared/VoiceCaptionButton';
import { generateDraftCaption } from '@/lib/captions/auto-caption';
import type { Roll, RollPhoto } from '@/types/roll';
import type { Photo } from '@/types/photo';

type BuildStep = 'name' | 'story' | 'captions';

interface RollPhotoWithPhoto extends RollPhoto {
  photos: Photo;
}

export default function RollBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [rollId, setRollId] = useState<string>('');
  const [roll, setRoll] = useState<Roll | null>(null);
  const [photos, setPhotos] = useState<RollPhotoWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<BuildStep>('name');

  // Step 1: Name
  const [themeName, setThemeName] = useState('');
  const [suggestion, setSuggestion] = useState('');

  // Step 2: Story
  const [story, setStory] = useState('');

  // Step 3: Captions
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [captions, setCaptions] = useState<Map<string, { text: string; source: string }>>(
    new Map()
  );
  const captionInputRef = useRef<HTMLTextAreaElement>(null);

  // Resolve params
  useEffect(() => {
    params.then((p) => setRollId(p.id));
  }, [params]);

  // Fetch roll data
  const fetchRoll = useCallback(async () => {
    if (!rollId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/rolls/${rollId}`);
      if (!res.ok) {
        router.push('/library');
        return;
      }
      const json = await res.json();
      setRoll(json.data.roll as Roll);
      setPhotos((json.data.photos ?? []) as RollPhotoWithPhoto[]);
      if (json.data.roll.theme_name) setThemeName(json.data.roll.theme_name);
      if (json.data.roll.story) setStory(json.data.roll.story);
    } catch {
      router.push('/library');
    } finally {
      setLoading(false);
    }
  }, [rollId, router]);

  useEffect(() => {
    fetchRoll();
  }, [fetchRoll]);

  // Fetch name suggestion
  useEffect(() => {
    if (!rollId || themeName) return;
    async function fetchSuggestion() {
      try {
        const res = await fetch(`/api/rolls/${rollId}/suggest-name`);
        if (!res.ok) return;
        const json = await res.json();
        if (json.suggestion) setSuggestion(json.suggestion);
      } catch {
        // Non-critical
      }
    }
    fetchSuggestion();
  }, [rollId, themeName]);

  // Initialize captions from photos
  useEffect(() => {
    if (photos.length === 0) return;
    const initialCaptions = new Map<string, { text: string; source: string }>();
    for (const rp of photos) {
      if (rp.caption) {
        initialCaptions.set(rp.photo_id, { text: rp.caption, source: rp.caption_source ?? 'manual' });
      } else {
        const draft = generateDraftCaption({
          scene_classification: rp.photos?.scene_classification,
          date_taken: rp.photos?.date_taken,
          face_count: rp.photos?.face_count,
        });
        if (draft) {
          initialCaptions.set(rp.photo_id, { text: draft, source: 'auto_draft' });
        }
      }
    }
    setCaptions(initialCaptions);
  }, [photos]);

  const captionedCount = Array.from(captions.values()).filter((c: { text: string }) => c.text.trim().length > 0).length;
  const currentPhoto = photos[currentPhotoIndex];
  const currentCaption = currentPhoto ? captions.get(currentPhoto.photo_id) : undefined;

  const updateCaption = (photoId: string, text: string, source: string) => {
    setCaptions((prev) => {
      const next = new Map(prev);
      next.set(photoId, { text, source });
      return next;
    });
  };

  const handleSaveAndFinish = async () => {
    setSaving(true);
    try {
      // Save theme_name and story
      await fetch(`/api/rolls/${rollId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme_name: themeName, story: story || undefined }),
      });

      // Batch save captions
      const captionUpdates: Array<{ photoId: string; caption: string; captionSource: string }> = [];
      captions.forEach((val, photoId) => {
        if (val.text.trim().length > 0) {
          captionUpdates.push({ photoId, caption: val.text, captionSource: val.source });
        }
      });

      if (captionUpdates.length > 0) {
        await fetch(`/api/rolls/${rollId}/photos`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ captions: captionUpdates }),
        });
      }

      // Navigate to develop flow
      router.push(`/roll/${rollId}`);
    } catch {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!roll) return null;

  return (
    <div className="flex flex-col min-h-[calc(100vh-80px)]">
      {/* Progress indicator */}
      <div className="flex items-center gap-[var(--space-tight)] px-[var(--space-component)] py-[var(--space-element)]">
        {(['name', 'story', 'captions'] as BuildStep[]).map((s, i) => (
          <div key={s} className="flex items-center gap-[var(--space-tight)] flex-1">
            <div
              className={`h-1 flex-1 rounded-full transition-colors ${
                s === step
                  ? 'bg-[var(--color-action)]'
                  : i < ['name', 'story', 'captions'].indexOf(step)
                    ? 'bg-[var(--color-developed)]'
                    : 'bg-[var(--color-surface-sunken)]'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Step 1: Name */}
      {step === 'name' && (
        <div className="flex-1 flex flex-col px-[var(--space-component)] py-[var(--space-section)]">
          <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-title)] font-medium text-[var(--color-ink)] mb-[var(--space-tight)]">
            What&rsquo;s the theme of these photos?
          </h1>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-section)]">
            Give this roll a name that captures the moment.
          </p>

          <div className="mb-[var(--space-section)]">
            <input
              type="text"
              value={themeName}
              onChange={(e) => setThemeName(e.target.value.slice(0, 60))}
              placeholder={suggestion || 'e.g., Summer in Portland'}
              className="w-full bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
              maxLength={60}
              autoFocus
            />
            <div className="flex items-center justify-between mt-[var(--space-tight)]">
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                {themeName.length}/60
              </span>
              {suggestion && !themeName && (
                <button
                  type="button"
                  onClick={() => setThemeName(suggestion)}
                  className="text-[length:var(--text-caption)] text-[var(--color-action)] hover:underline min-h-[44px] px-[var(--space-tight)]"
                >
                  Use suggestion: &ldquo;{suggestion}&rdquo;
                </button>
              )}
            </div>
          </div>

          {/* Photo thumbnail strip */}
          <div
            className="flex gap-[var(--space-micro)] overflow-x-auto pb-[var(--space-tight)] scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {photos.slice(0, 36).map((rp) => (
              <div
                key={rp.id}
                className="w-16 h-16 shrink-0 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                {rp.photos?.thumbnail_url && (
                  <img
                    src={rp.photos.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-auto pt-[var(--space-section)]">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setStep('story')}
              disabled={!themeName.trim()}
            >
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Story */}
      {step === 'story' && (
        <div className="flex-1 flex flex-col px-[var(--space-component)] py-[var(--space-section)]">
          <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-title)] font-medium text-[var(--color-ink)] mb-[var(--space-tight)]">
            Tell the story behind this roll
          </h1>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-section)]">
            This will appear as the introduction to your roll.
          </p>

          <div className="relative mb-[var(--space-element)]">
            <textarea
              value={story}
              onChange={(e) => setStory(e.target.value.slice(0, 2000))}
              placeholder="What was happening? Who was there? What do you want to remember?"
              className="w-full h-48 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none"
              maxLength={2000}
            />
            <div className="absolute bottom-3 right-3">
              <VoiceCaptionButton
                onTranscript={(text) => setStory(text.slice(0, 2000))}
              />
            </div>
          </div>
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {story.length}/2,000
          </span>

          <div className="mt-auto pt-[var(--space-section)] flex items-center gap-[var(--space-element)]">
            <Button variant="secondary" size="md" onClick={() => setStep('name')}>
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setStep('captions')}
              className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors min-h-[44px] px-[var(--space-tight)]"
            >
              Skip for now
            </button>
            <Button variant="primary" size="md" onClick={() => setStep('captions')}>
              Next
              <ChevronRight size={16} className="ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Captions */}
      {step === 'captions' && currentPhoto && (
        <div className="flex-1 flex flex-col px-[var(--space-component)] py-[var(--space-element)]">
          <div className="flex items-center justify-between mb-[var(--space-element)]">
            <h1 className="font-[family-name:var(--font-display)] text-[length:var(--text-heading)] font-medium text-[var(--color-ink)]">
              Add captions to your photos
            </h1>
            <span className="text-[length:var(--text-caption)] font-[family-name:var(--font-mono)] text-[var(--color-ink-secondary)] tabular-nums">
              {currentPhotoIndex + 1} of {photos.length}
            </span>
          </div>

          {/* Progress */}
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-element)]">
            Captioned {captionedCount} of {photos.length}
          </p>

          {/* Photo preview */}
          <div className="relative flex-1 min-h-0 max-h-[60vh] mb-[var(--space-element)] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)]">
            {currentPhoto.photos?.thumbnail_url ? (
              <img
                src={currentPhoto.processed_storage_key
                  ? `/api/photos/serve?key=${encodeURIComponent(currentPhoto.processed_storage_key)}`
                  : currentPhoto.photos.thumbnail_url}
                alt={currentCaption?.text || ''}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[var(--color-ink-tertiary)]">
                No preview
              </div>
            )}
          </div>

          {/* Caption input */}
          <div className="flex items-start gap-[var(--space-tight)] mb-[var(--space-element)]">
            <textarea
              ref={captionInputRef}
              value={currentCaption?.text ?? ''}
              onChange={(e) =>
                updateCaption(currentPhoto.photo_id, e.target.value, 'manual')
              }
              placeholder="Add a caption…"
              className="flex-1 bg-[var(--color-surface-sunken)] text-[var(--color-ink)] text-[length:var(--text-body)] px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-card)] border border-[var(--color-border)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none h-20"
              maxLength={500}
            />
            <VoiceCaptionButton
              onTranscript={(text) =>
                updateCaption(currentPhoto.photo_id, text, 'voice')
              }
            />
          </div>

          {/* Filmstrip navigation */}
          <div
            className="flex gap-[var(--space-micro)] overflow-x-auto pb-[var(--space-tight)] scrollbar-hide"
            style={{ scrollSnapType: 'x mandatory' }}
          >
            {photos.map((rp, i) => (
              <button
                key={rp.id}
                type="button"
                onClick={() => setCurrentPhotoIndex(i)}
                className={`w-12 h-12 shrink-0 rounded-[var(--radius-sharp)] overflow-hidden border-2 transition-colors ${
                  i === currentPhotoIndex
                    ? 'border-[var(--color-action)]'
                    : 'border-transparent'
                }`}
                style={{ scrollSnapAlign: 'start' }}
              >
                {rp.photos?.thumbnail_url && (
                  <img
                    src={rp.photos.thumbnail_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-[var(--space-element)] pt-[var(--space-element)]">
            <Button variant="secondary" size="md" onClick={() => setStep('story')}>
              <ChevronLeft size={16} className="mr-1" />
              Back
            </Button>
            <div className="flex-1 flex items-center justify-center gap-[var(--space-tight)]">
              <button
                type="button"
                onClick={() => setCurrentPhotoIndex(Math.max(0, currentPhotoIndex - 1))}
                disabled={currentPhotoIndex === 0}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] disabled:opacity-30 transition-colors"
                aria-label="Previous photo"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentPhotoIndex(Math.min(photos.length - 1, currentPhotoIndex + 1))
                }
                disabled={currentPhotoIndex >= photos.length - 1}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] disabled:opacity-30 transition-colors"
                aria-label="Next photo"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveAndFinish}
              className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink-secondary)] transition-colors min-h-[44px] px-[var(--space-tight)] flex items-center gap-1"
            >
              <SkipForward size={14} />
              Skip All
            </button>
            <Button
              variant="primary"
              size="md"
              onClick={handleSaveAndFinish}
              isLoading={saving}
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
