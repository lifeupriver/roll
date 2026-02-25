'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Play, Heart, Share2, MessageSquare, Wand2 } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { ReelStoryboard } from '@/components/reel/ReelStoryboard';
import { AudioMoodSelector } from '@/components/reel/AudioMoodSelector';
import { ContentModePills } from '@/components/photo/ContentModePills';
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
      router.push(`/library/reels/${currentReel.id}/screen`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Development failed');
      updateReelStatus(currentReel.id, { status: 'error' });
    } finally {
      setDeveloping(false);
    }
  }, [currentReel, filmProfile, audioMood, updateReelStatus, router]);

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
    </div>
  );
}
