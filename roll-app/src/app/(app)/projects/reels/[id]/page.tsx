'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Film, Play, Volume2, VolumeX, Scissors, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Empty } from '@/components/ui/Empty';
import { useToast } from '@/stores/toastStore';
import type { Reel, ReelClip, AudioMood, AUDIO_MOODS } from '@/types/reel';

interface Photo {
  id: string;
  thumbnail_url: string;
  storage_key: string;
  media_type?: 'photo' | 'video';
  preview_storage_key?: string | null;
  duration_ms?: number | null;
}

interface ClipWithPhoto extends ReelClip {
  photos: Photo;
}

const CLIP_LENGTH_OPTIONS = [
  { value: 3000, label: '3s' },
  { value: 5000, label: '5s' },
  { value: 8000, label: '8s' },
  { value: 10000, label: '10s' },
  { value: 15000, label: '15s' },
];

const AUDIO_OPTIONS: Array<{ id: AudioMood; label: string }> = [
  { id: 'original', label: 'Original Audio' },
  { id: 'quiet_film', label: 'Quiet Film' },
  { id: 'silent_film', label: 'Silent (No Audio)' },
  { id: 'ambient', label: 'Ambient' },
];

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ReelDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const reelId = params.id;

  const [reel, setReel] = useState<Reel | null>(null);
  const [clips, setClips] = useState<ClipWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [defaultClipLength, setDefaultClipLength] = useState(5000);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const fetchReel = useCallback(async () => {
    try {
      const res = await fetch(`/api/reels/${reelId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load reel');
      }
      const { data } = await res.json();
      setReel(data.reel);
      setClips(data.clips ?? []);
      setAudioEnabled(data.reel.audio_mood !== 'silent_film');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reel');
    } finally {
      setLoading(false);
    }
  }, [reelId]);

  useEffect(() => {
    fetchReel();
  }, [fetchReel]);

  const handleAudioToggle = useCallback(async () => {
    if (!reel) return;
    const newMood: AudioMood = audioEnabled ? 'silent_film' : 'original';
    setAudioEnabled(!audioEnabled);
    try {
      await fetch(`/api/reels/${reelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio_mood: newMood }),
      });
    } catch {
      toast('Failed to update audio setting', 'error');
      setAudioEnabled(audioEnabled);
    }
  }, [reel, reelId, audioEnabled, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-[var(--space-hero)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !reel) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
        <p className="text-[length:var(--text-body)] text-[var(--color-error)]">{error || 'Reel not found'}</p>
        <Button variant="secondary" size="sm" onClick={() => router.push('/projects')}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          onClick={() => router.push('/projects')}
          className="p-1 text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] truncate">
            {reel.name || 'Untitled Reel'}
          </h1>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''}
            {reel.assembled_duration_ms && <> &middot; {formatDuration(reel.assembled_duration_ms)}</>}
          </p>
        </div>
      </div>

      {/* Settings */}
      <div className="flex flex-col gap-[var(--space-component)] p-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)]">
        <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink)]">
          Settings
        </h2>

        {/* Clip length */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            <Scissors size={16} className="text-[var(--color-ink-secondary)]" />
            <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">Default Clip Length</span>
          </div>
          <div className="flex items-center gap-1">
            {CLIP_LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDefaultClipLength(opt.value)}
                className={`px-2 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                  defaultClipLength === opt.value
                    ? 'bg-[var(--color-action)] text-white'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[var(--space-element)]">
            {audioEnabled ? (
              <Volume2 size={16} className="text-[var(--color-ink-secondary)]" />
            ) : (
              <VolumeX size={16} className="text-[var(--color-ink-secondary)]" />
            )}
            <span className="text-[length:var(--text-label)] text-[var(--color-ink)]">Audio</span>
          </div>
          <button
            type="button"
            onClick={handleAudioToggle}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              audioEnabled ? 'bg-[var(--color-action)]' : 'bg-[var(--color-surface-sunken)]'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                audioEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio mood selector (when audio is on) */}
        {audioEnabled && (
          <div className="flex items-center gap-1 pl-7">
            {AUDIO_OPTIONS.filter((o) => o.id !== 'silent_film').map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={async () => {
                  try {
                    await fetch(`/api/reels/${reelId}`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ audio_mood: opt.id }),
                    });
                    setReel((prev) => prev ? { ...prev, audio_mood: opt.id } : prev);
                  } catch {
                    toast('Failed to update audio mood', 'error');
                  }
                }}
                className={`px-2 py-1 rounded-[var(--radius-pill)] text-[length:var(--text-caption)] font-medium transition-colors ${
                  reel.audio_mood === opt.id
                    ? 'bg-[var(--color-action)] text-white'
                    : 'bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clips list */}
      <div className="flex flex-col gap-[var(--space-element)]">
        <h2 className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] font-medium text-[var(--color-ink-secondary)]">
          Clips ({clips.length})
        </h2>

        {clips.length === 0 && (
          <Empty
            icon={Film}
            title="No clips yet"
            description="Add video clips from your feed to build this reel."
          />
        )}

        {clips.map((clip, index) => (
          <div
            key={clip.id}
            className="flex items-center gap-[var(--space-element)] p-[var(--space-element)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)]"
          >
            {/* Thumbnail */}
            <div className="relative w-20 aspect-video bg-[var(--color-surface-sunken)] rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0">
              {clip.photos?.thumbnail_url ? (
                <img
                  src={clip.photos.thumbnail_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film size={16} className="text-[var(--color-ink-tertiary)]" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-black/40 flex items-center justify-center">
                  <Play size={10} className="text-white ml-0.5" fill="white" />
                </div>
              </div>
            </div>

            {/* Clip info */}
            <div className="flex-1 min-w-0">
              <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)]">
                Clip {index + 1}
              </p>
              <div className="flex items-center gap-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                <Clock size={10} />
                <span>{formatDuration(clip.trimmed_duration_ms)}</span>
                {clip.trim_start_ms > 0 && (
                  <span className="text-[var(--color-ink-tertiary)]">
                    (trimmed from {formatDuration(clip.trim_start_ms)})
                  </span>
                )}
              </div>
            </div>

            {/* Position number */}
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tabular-nums">
              #{clip.position}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
