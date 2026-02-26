'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Heart, Share2, MessageSquare, Wand2, Film } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { ReelStoryboard } from '@/components/reel/ReelStoryboard';
import { AudioMoodSelector } from '@/components/reel/AudioMoodSelector';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { formatDuration } from '@/components/reel/ClipDurationBadge';
import { useReelStore } from '@/stores/reelStore';
import { useToast } from '@/stores/toastStore';
import { FILM_PROFILES } from '@/types/roll';
import type { Reel, ReelClip, AudioMood } from '@/types/reel';
import type { FilmProfileId } from '@/types/roll';
import { track } from '@/lib/analytics';

export default function ReelDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const reelId = params.id as string;

  const {
    currentReel,
    reelClips,
    filmProfile,
    audioMood,
    setReel,
    setReelClips,
    setFilmProfile,
    setAudioMood,
    reorderClips,
    removeClip,
    updateReelStatus,
  } = useReelStore();

  const [loading, setLoading] = useState(true);
  const [developing, setDeveloping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<'free' | 'plus'>('free');

  // Reel caption editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState('');

  // Reel favorites
  const [isFavorited, setIsFavorited] = useState(false);

  // Post-development configuration
  const [showConfig, setShowConfig] = useState(false);
  const [configName, setConfigName] = useState('');
  const [defaultClipLengthS, setDefaultClipLengthS] = useState(3);
  const [clipTrims, setClipTrims] = useState<Map<string, { startMs: number; endMs: number | null }>>(new Map());
  const [savingConfig, setSavingConfig] = useState(false);

  // Load reel data
  useEffect(() => {
    async function loadReel() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reels/${reelId}`);
        if (!res.ok) throw new Error('Failed to load reel');
        const { data } = await res.json();
        setReel(data.reel as Reel);
        setReelClips(data.clips as ReelClip[]);
        if (data.reel.film_profile) setFilmProfile(data.reel.film_profile);
        if (data.reel.audio_mood) setAudioMood(data.reel.audio_mood);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadReel();
  }, [reelId, setReel, setReelClips, setFilmProfile, setAudioMood]);

  // Check if reel is favorited
  useEffect(() => {
    if (!currentReel || currentReel.status !== 'developed') return;
    async function checkFavorite() {
      try {
        const res = await fetch(`/api/reels/${reelId}/favorite`);
        if (res.ok) {
          const { data } = await res.json();
          setIsFavorited(!!data?.favorited);
        }
      } catch {
        // Non-critical
      }
    }
    checkFavorite();
  }, [reelId, currentReel?.status]);

  // Reel name editing
  const handleStartEditing = useCallback(() => {
    setEditName(currentReel?.name || '');
    setIsEditingName(true);
  }, [currentReel?.name]);

  const handleSaveName = useCallback(async () => {
    if (!currentReel) return;
    const trimmed = editName.trim();
    if (!trimmed || trimmed === currentReel.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const res = await fetch(`/api/reels/${reelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) throw new Error('Failed to rename');
      const { data } = await res.json();
      setReel(data);
      setIsEditingName(false);
    } catch {
      toast('Failed to rename reel', 'error');
    }
  }, [currentReel, editName, reelId, toast, setReel]);

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleSaveName();
      if (e.key === 'Escape') setIsEditingName(false);
    },
    [handleSaveName]
  );

  // Favorite toggle
  const handleFavoriteToggle = useCallback(async () => {
    const newVal = !isFavorited;
    setIsFavorited(newVal);
    try {
      if (newVal) {
        const res = await fetch(`/api/reels/${reelId}/favorite`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`/api/reels/${reelId}/favorite`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      setIsFavorited(!newVal);
      toast('Failed to update favorite', 'error');
    }
  }, [isFavorited, reelId, toast]);

  const handleReorder = useCallback(async (fromIndex: number, toIndex: number) => {
    reorderClips(fromIndex, toIndex);
  }, [reorderClips]);

  const handleRemoveClip = useCallback(async (photoId: string) => {
    if (!currentReel) return;
    removeClip(photoId);
    try {
      await fetch(`/api/reels/${currentReel.id}/clips`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId }),
      });
    } catch {
      // Reload on error
    }
  }, [currentReel, removeClip]);

  const handleEditTrim = useCallback((clipId: string) => {
    track({ event: 'reel_trim_opened', properties: { reelId, clipId } });
  }, [reelId]);

  const handleDevelop = useCallback(async () => {
    if (!currentReel || !filmProfile) return;
    setDeveloping(true);
    try {
      const res = await fetch('/api/process/develop-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reelId: currentReel.id,
          filmProfileId: filmProfile,
          audioMood,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to develop reel');
      }

      updateReelStatus(currentReel.id, { status: 'developed' });
      track({ event: 'reel_developed', properties: { reelId: currentReel.id, filmProfile, audioMood } });

      // Initialize config screen with suggested name and existing trim points
      const suggestedName = currentReel.name || `Reel — ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
      setConfigName(suggestedName);
      setDefaultClipLengthS(3);
      const trims = new Map<string, { startMs: number; endMs: number | null }>();
      for (const clip of reelClips) {
        trims.set(clip.photo_id, { startMs: clip.trim_start_ms, endMs: clip.trim_end_ms });
      }
      setClipTrims(trims);
      setShowConfig(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Development failed');
      updateReelStatus(currentReel.id, { status: 'error' });
    } finally {
      setDeveloping(false);
    }
  }, [currentReel, filmProfile, audioMood, updateReelStatus, reelClips]);

  const handleSaveConfig = useCallback(async () => {
    if (!currentReel) return;
    setSavingConfig(true);
    try {
      // Save reel name
      await fetch(`/api/reels/${currentReel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: configName.trim() || currentReel.name }),
      });

      // Save trim points for clips
      for (const [photoId, trim] of clipTrims.entries()) {
        const clip = reelClips.find((c) => c.photo_id === photoId);
        if (clip && (clip.trim_start_ms !== trim.startMs || clip.trim_end_ms !== trim.endMs)) {
          const { setTrim } = useReelStore.getState();
          setTrim(photoId, trim.startMs, trim.endMs);
        }
      }

      toast('Reel saved', 'success');
      track({ event: 'reel_config_saved', properties: { reelId: currentReel.id, defaultClipLength: defaultClipLengthS } });
      setShowConfig(false);
      router.push(`/library/reels/${currentReel.id}/screen`);
    } catch {
      toast('Failed to save reel settings', 'error');
    } finally {
      setSavingConfig(false);
    }
  }, [currentReel, configName, clipTrims, reelClips, defaultClipLengthS, toast, router]);

  const handleSkipConfig = useCallback(() => {
    if (!currentReel) return;
    setShowConfig(false);
    router.push(`/library/reels/${currentReel.id}/screen`);
  }, [currentReel, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="md" />
      </div>
    );
  }

  if (!currentReel) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
        <p className="text-[var(--color-error)]">{error || 'Reel not found'}</p>
        <Button variant="secondary" onClick={() => router.push('/library')}>Back to Library</Button>
      </div>
    );
  }

  const isDeveloped = currentReel.status === 'developed';
  const isReady = currentReel.status === 'ready' || currentReel.status === 'building';
  const canDevelop = (currentReel.status === 'ready' || reelClips.length >= 3) && filmProfile !== null;

  const profileOptions = FILM_PROFILES.map((p) => ({
    value: p.id,
    label: p.name,
    count: undefined,
  }));

  return (
    <div className="flex flex-col gap-[var(--space-section)] pb-8">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <BackButton href="/library" label="Back to library" />
        <div className="flex-1 min-w-0">
          {isEditingName ? (
            <input
              autoFocus
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleNameKeyDown}
              placeholder="Caption this reel..."
              className="w-full bg-transparent border-b border-[var(--color-border)] pb-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-action)]"
            />
          ) : (
            <button type="button" onClick={handleStartEditing} className="text-left w-full">
              <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] truncate">
                {currentReel.name || <span className="text-[var(--color-ink-tertiary)]">Add a caption...</span>}
              </h1>
            </button>
          )}
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)] tabular-nums">
            {reelClips.length} clip{reelClips.length !== 1 ? 's' : ''} &middot; {formatDuration(currentReel.current_duration_ms)} / {formatDuration(currentReel.target_duration_ms)}
          </p>
        </div>
        <div className="flex items-center gap-[var(--space-tight)]">
          {isDeveloped && (
            <>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                className={`p-2 rounded-full transition-colors ${isFavorited ? 'text-red-500' : 'text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)]'}`}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push(`/library/reels/${reelId}/screen`)}
              >
                <Play size={16} className="mr-1" /> Screen
              </Button>
            </>
          )}
          {isDeveloped && (
            <span className="inline-flex items-center gap-1 px-[var(--space-tight)] py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium bg-[var(--color-developed)]/10 text-[var(--color-developed)]">
              <Wand2 size={10} /> Developed
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="p-[var(--space-element)] bg-[var(--color-error)]/10 rounded-[var(--radius-card)] text-[var(--color-error)] text-[length:var(--text-label)]">
          {error}
        </div>
      )}

      {/* Storyboard */}
      {isReady && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)] mb-[var(--space-element)]">
            Storyboard
          </h2>
          <ReelStoryboard
            clips={reelClips as (ReelClip & { photos?: any })[]}
            onReorder={handleReorder}
            onRemove={handleRemoveClip}
            onEditTrim={handleEditTrim}
          />
        </section>
      )}

      {/* Film Profile Selector */}
      {isReady && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)] mb-[var(--space-element)]">
            Film Stock
          </h2>
          <ContentModePills
            activeMode={filmProfile ?? ''}
            onChange={(id) => setFilmProfile(id as FilmProfileId)}
            options={profileOptions}
          />
        </section>
      )}

      {/* Audio Mood Selector */}
      {isReady && (
        <section>
          <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)] mb-[var(--space-element)]">
            Audio Mood
          </h2>
          <AudioMoodSelector
            selected={audioMood}
            onChange={(mood) => setAudioMood(mood)}
            userTier={userTier}
          />
        </section>
      )}

      {/* Develop CTA */}
      {isReady && (
        <div className="sticky bottom-0 bg-[var(--color-surface)] py-[var(--space-component)] border-t border-[var(--color-border)]">
          <Button
            variant="primary"
            size="lg"
            disabled={!canDevelop || developing}
            isLoading={developing}
            onClick={handleDevelop}
            className="w-full"
          >
            {developing ? 'Developing...' : 'Develop This Reel'}
          </Button>
          {!filmProfile && (
            <p className="text-center text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-micro)]">
              Choose a film stock to develop
            </p>
          )}
        </div>
      )}

      {/* Developed reel actions */}
      {isDeveloped && (
        <div className="flex flex-col gap-[var(--space-element)]">
          <Button variant="secondary" size="lg" onClick={() => router.push('/circle')}>
            <Share2 size={18} className="mr-2" />
            Share to Circle
          </Button>
        </div>
      )}

      {/* Post-development configuration modal */}
      {showConfig && (
        <Modal isOpen={showConfig} onClose={handleSkipConfig}>
          <div className="flex flex-col gap-[var(--space-section)] max-h-[85vh] overflow-y-auto">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
              Configure Your Reel
            </h2>

            {/* Reel Name Input */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label htmlFor="reel-name" className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                Reel name
              </label>
              <input
                id="reel-name"
                type="text"
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Name your reel"
                className="w-full px-[var(--space-element)] py-[var(--space-element)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-ink)] text-[length:var(--text-body)] focus:outline-none focus:border-[var(--color-action)] min-h-[44px]"
              />
            </div>

            {/* Default Clip Length */}
            <div className="flex flex-col gap-[var(--space-tight)]">
              <label className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                Default clip length
              </label>
              <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                Each clip will play for this duration unless you trim it individually
              </p>
              <div className="flex gap-[var(--space-tight)]">
                {[2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setDefaultClipLengthS(s)}
                    className={`flex-1 px-[var(--space-element)] py-[var(--space-tight)] rounded-[var(--radius-pill)] text-[length:var(--text-label)] font-medium min-h-[44px] transition-colors ${
                      defaultClipLengthS === s
                        ? 'bg-[#C45D3E] text-white'
                        : 'bg-[var(--color-surface-raised)] text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]'
                    }`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            {/* Clip Trimming */}
            <div className="flex flex-col gap-[var(--space-element)]">
              <label className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                Clip trimming
              </label>
              <div className="flex flex-col gap-[var(--space-tight)] max-h-60 overflow-y-auto">
                {reelClips.map((clip) => {
                  const trim = clipTrims.get(clip.photo_id) ?? { startMs: clip.trim_start_ms, endMs: clip.trim_end_ms };
                  const effectiveEnd = trim.endMs ?? clip.trimmed_duration_ms + clip.trim_start_ms;
                  const clipDuration = effectiveEnd - trim.startMs;
                  const totalDuration = clip.trimmed_duration_ms + clip.trim_start_ms + (clip.trim_end_ms ? (clip.trimmed_duration_ms + clip.trim_start_ms - clip.trim_end_ms) : 0);
                  const maxMs = Math.max(totalDuration, effectiveEnd, 10000);

                  return (
                    <div key={clip.id} className="flex items-center gap-[var(--space-element)] bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] p-[var(--space-tight)]">
                      {/* Thumbnail */}
                      <div className="relative shrink-0 w-12 h-12 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]">
                        {(clip as ReelClip & { photos?: { thumbnail_url?: string } }).photos?.thumbnail_url ? (
                          <img
                            src={(clip as ReelClip & { photos?: { thumbnail_url?: string } }).photos!.thumbnail_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Film size={12} className="text-[var(--color-ink-tertiary)]" />
                          </div>
                        )}
                      </div>

                      {/* Trim slider */}
                      <div className="flex-1 min-w-0">
                        <div className="relative h-6 bg-[var(--color-surface-sunken)] rounded-sm overflow-hidden cursor-pointer">
                          <div
                            className="absolute top-0 bottom-0 bg-[#C45D3E]/20 border-x-2 border-[#C45D3E]"
                            style={{
                              left: `${(trim.startMs / maxMs) * 100}%`,
                              width: `${(clipDuration / maxMs) * 100}%`,
                            }}
                          />
                          {/* Start handle */}
                          <input
                            type="range"
                            min={0}
                            max={maxMs}
                            value={trim.startMs}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              const newTrims = new Map(clipTrims);
                              newTrims.set(clip.photo_id, { ...trim, startMs: Math.min(val, effectiveEnd - 1000) });
                              setClipTrims(newTrims);
                            }}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer"
                            aria-label={`Trim start for clip ${clip.position}`}
                          />
                        </div>
                        <span className="text-[length:var(--text-caption)] font-[family-name:var(--font-mono)] text-[var(--color-ink-tertiary)] tabular-nums">
                          {formatDuration(clipDuration)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-[var(--space-element)] pt-[var(--space-element)]">
              <button
                type="button"
                onClick={handleSkipConfig}
                className="flex-1 px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] text-[var(--color-ink-secondary)] text-[length:var(--text-label)] font-medium min-h-[44px] transition-colors hover:bg-[var(--color-surface-raised)]"
              >
                Save with defaults
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex-1 px-[var(--space-component)] py-[var(--space-element)] rounded-[var(--radius-sharp)] bg-[#C45D3E] text-white text-[length:var(--text-label)] font-semibold min-h-[44px] transition-colors hover:bg-[#B04E32] disabled:opacity-50"
              >
                {savingConfig ? 'Saving...' : 'Save Reel'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
