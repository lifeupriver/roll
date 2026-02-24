'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { ContentModePills } from '@/components/photo/ContentModePills';
import { formatDuration } from '@/components/reel/ClipDurationBadge';
import { useToast } from '@/stores/toastStore';

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  photos: {
    thumbnail_url: string;
    date_taken: string | null;
  } | null;
}

interface DevelopedReel {
  id: string;
  name: string | null;
  poster_storage_key: string | null;
  assembled_duration_ms: number | null;
  film_profile: string | null;
  clip_count: number;
}

type ShareMode = 'photos' | 'reel';

const SHARE_MODE_OPTIONS = [
  { value: 'photos', label: 'Photos' },
  { value: 'reel', label: 'Reel' },
];

interface ShareToCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
}

export function ShareToCircleModal({ isOpen, onClose, circleId }: ShareToCircleModalProps) {
  const { toast } = useToast();
  const [shareMode, setShareMode] = useState<ShareMode>('photos');
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [reels, setReels] = useState<DevelopedReel[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [sharing, setSharing] = useState(false);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/favorites');
      if (res.ok) {
        const { data } = await res.json();
        setFavorites(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reels?status=developed');
      if (res.ok) {
        const { data } = await res.json();
        setReels(data ?? []);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(new Set());
      setSelectedReelId(null);
      setCaption('');
      setShareMode('photos');
      fetchFavorites();
    }
  }, [isOpen, fetchFavorites]);

  // Fetch reels when switching to reel mode
  useEffect(() => {
    if (isOpen && shareMode === 'reel' && reels.length === 0) {
      fetchReels();
    }
  }, [isOpen, shareMode, reels.length, fetchReels]);

  const toggleSelection = (photoId: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) {
        next.delete(photoId);
      } else {
        next.add(photoId);
      }
      return next;
    });
  };

  const handleShare = async () => {
    if (shareMode === 'photos' && selectedKeys.size === 0) {
      toast('Select at least one photo to share', 'error');
      return;
    }
    if (shareMode === 'reel' && !selectedReelId) {
      toast('Select a reel to share', 'error');
      return;
    }

    setSharing(true);
    try {
      const body =
        shareMode === 'reel'
          ? { caption: caption.trim() || undefined, reelId: selectedReelId }
          : { caption: caption.trim() || undefined, photoStorageKeys: Array.from(selectedKeys) };

      const res = await fetch(`/api/circles/${circleId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast(`Shared ${shareMode === 'reel' ? 'reel' : 'photos'} to Circle!`, 'success');
        onClose();
      } else {
        const { error } = await res.json();
        toast(error || 'Failed to share', 'error');
      }
    } catch {
      toast('Something went wrong', 'error');
    } finally {
      setSharing(false);
    }
  };

  const canShare = shareMode === 'photos' ? selectedKeys.size > 0 : selectedReelId !== null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[var(--space-component)]">
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
          Share to Circle
        </h2>

        {/* Mode toggle */}
        <ContentModePills
          activeMode={shareMode}
          onChange={(mode) => setShareMode(mode as ShareMode)}
          options={SHARE_MODE_OPTIONS}
        />

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-[var(--space-section)]">
            <Spinner />
          </div>
        )}

        {/* Photos mode */}
        {!loading && shareMode === 'photos' && (
          <>
            {favorites.length === 0 && (
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-section)]">
                No favorites to share yet. Develop a roll first, then heart your favorite
                color-corrected photos.
              </p>
            )}

            {favorites.length > 0 && (
              <>
                <div className="grid grid-cols-3 gap-1 max-h-[320px] overflow-y-auto rounded-[var(--radius-card)]">
                  {favorites.map((fav) => {
                    const isSelected = selectedKeys.has(fav.photo_id);
                    const thumbnailUrl = fav.photos?.thumbnail_url;

                    if (!thumbnailUrl) return null;

                    return (
                      <button
                        key={fav.id}
                        onClick={() => toggleSelection(fav.photo_id)}
                        className="relative aspect-square overflow-hidden bg-[var(--color-surface-sunken)] group"
                      >
                        <img
                          src={thumbnailUrl}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                        {/* Selection overlay */}
                        <div
                          className={`absolute inset-0 transition-all duration-150 ${
                            isSelected
                              ? 'bg-[var(--color-action)]/20 ring-2 ring-inset ring-[var(--color-action)]'
                              : ''
                          }`}
                        />
                        {/* Checkbox indicator */}
                        <div
                          className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-150 ${
                            isSelected
                              ? 'bg-[var(--color-action)] scale-100'
                              : 'bg-[var(--color-surface-overlay)]/40 border border-white/60 scale-90 opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} strokeWidth={2.5} className="text-white" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                  {selectedKeys.size} {selectedKeys.size === 1 ? 'photo' : 'photos'} selected
                </span>
              </>
            )}
          </>
        )}

        {/* Reel mode */}
        {!loading && shareMode === 'reel' && (
          <>
            {reels.length === 0 && (
              <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-section)]">
                No developed reels to share. Develop a reel first.
              </p>
            )}

            {reels.length > 0 && (
              <div className="flex flex-col gap-[var(--space-tight)] max-h-[320px] overflow-y-auto">
                {reels.map((reel) => {
                  const isSelected = selectedReelId === reel.id;
                  const posterUrl = reel.poster_storage_key
                    ? `/api/photos/serve?key=${encodeURIComponent(reel.poster_storage_key)}`
                    : null;

                  return (
                    <button
                      key={reel.id}
                      type="button"
                      onClick={() => setSelectedReelId(isSelected ? null : reel.id)}
                      className={[
                        'flex items-center gap-[var(--space-element)] p-[var(--space-element)]',
                        'rounded-[var(--radius-card)] text-left transition-all duration-150',
                        isSelected
                          ? 'bg-[var(--color-action-subtle)] ring-2 ring-[var(--color-action)]'
                          : 'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-sunken)]',
                      ].join(' ')}
                    >
                      {/* Poster thumbnail */}
                      <div className="relative shrink-0 w-16 h-10 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)]">
                        {posterUrl && (
                          <img src={posterUrl} alt="" className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Play
                            size={16}
                            className="text-white/80"
                            fill="white"
                            fillOpacity={0.6}
                          />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-[length:var(--text-label)] font-medium text-[var(--color-ink)] truncate">
                          {reel.name || 'Untitled Reel'}
                        </p>
                        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-mono)]">
                          {reel.clip_count} clip{reel.clip_count !== 1 ? 's' : ''}
                          {reel.assembled_duration_ms &&
                            ` \u00B7 ${formatDuration(reel.assembled_duration_ms)}`}
                        </p>
                      </div>

                      {/* Selection indicator */}
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 ${
                          isSelected
                            ? 'bg-[var(--color-action)]'
                            : 'border-2 border-[var(--color-border)]'
                        }`}
                      >
                        {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Caption + actions (shared across modes) */}
        {!loading && (
          <>
            <Input
              label="Caption"
              placeholder={
                shareMode === 'reel'
                  ? 'Say something about this reel...'
                  : 'Say something about these photos...'
              }
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <div className="flex items-center justify-end gap-[var(--space-element)]">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleShare}
                isLoading={sharing}
                disabled={!canShare}
              >
                Share
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
