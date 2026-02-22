'use client';

import { useEffect, useState, useCallback } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/stores/toastStore';

interface FavoriteWithPhoto {
  id: string;
  photo_id: string;
  photos: {
    thumbnail_url: string;
    date_taken: string | null;
  } | null;
}

interface ShareToCircleModalProps {
  isOpen: boolean;
  onClose: () => void;
  circleId: string;
}

export function ShareToCircleModal({ isOpen, onClose, circleId }: ShareToCircleModalProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteWithPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    if (isOpen) {
      fetchFavorites();
      setSelectedKeys(new Set());
      setCaption('');
    }
  }, [isOpen, fetchFavorites]);

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
    if (selectedKeys.size === 0) {
      toast('Select at least one photo to share', 'error');
      return;
    }

    setSharing(true);
    try {
      // The API expects photoStorageKeys (storage_key values).
      // Favorites have photo_id; we pass them as storage keys since the
      // post photos table references storage_key. We use the photo_id
      // which maps to the photo's storage key path.
      const photoStorageKeys = Array.from(selectedKeys);

      const res = await fetch(`/api/circles/${circleId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: caption.trim() || undefined,
          photoStorageKeys,
        }),
      });

      if (res.ok) {
        toast('Shared to Circle!', 'success');
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-[var(--space-component)]">
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)]">
          Share to Circle
        </h2>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-[var(--space-section)]">
            <Spinner />
          </div>
        )}

        {/* No favorites */}
        {!loading && favorites.length === 0 && (
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center py-[var(--space-section)]">
            No favorites to share. Develop a roll and favorite some photos first.
          </p>
        )}

        {/* Favorites grid */}
        {!loading && favorites.length > 0 && (
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
                      {isSelected && <Check size={14} strokeWidth={2.5} className="text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <Input
              label="Caption"
              placeholder="Say something about these photos..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />

            <div className="flex items-center justify-between">
              <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                {selectedKeys.size} {selectedKeys.size === 1 ? 'photo' : 'photos'} selected
              </span>
              <div className="flex gap-[var(--space-element)]">
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleShare}
                  isLoading={sharing}
                  disabled={selectedKeys.size === 0}
                >
                  Share
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
