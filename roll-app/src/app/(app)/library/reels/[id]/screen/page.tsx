'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ReelPlayer } from '@/components/reel/ReelPlayer';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import type { Reel } from '@/types/reel';
import { track } from '@/lib/analytics';

export default function ReelScreenPage() {
  const router = useRouter();
  const params = useParams();
  const reelId = params.id as string;

  const [reel, setReel] = useState<Reel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHearted, setIsHearted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReel() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reels/${reelId}`);
        if (!res.ok) throw new Error('Failed to load reel');
        const { data } = await res.json();
        setReel(data.reel as Reel);

        // Check if favorited
        const favRes = await fetch(`/api/reels/${reelId}/favorite`);
        if (favRes.ok) {
          // If the endpoint returns data, it's favorited
          // This is a simplified check; the actual endpoint may need adjustment
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    loadReel();
  }, [reelId]);

  const handleHeart = useCallback(
    async (hearted: boolean) => {
      setIsHearted(hearted);
      try {
        if (hearted) {
          await fetch(`/api/reels/${reelId}/favorite`, { method: 'POST' });
          track({ event: 'reel_favorited', properties: { reelId } });
        } else {
          await fetch(`/api/reels/${reelId}/favorite`, { method: 'DELETE' });
          track({ event: 'reel_unfavorited', properties: { reelId } });
        }
      } catch {
        setIsHearted(!hearted);
      }
    },
    [reelId]
  );

  const handleShare = useCallback(() => {
    // Navigate to circle share flow
    track({ event: 'reel_share_initiated', properties: { reelId } });
  }, [reelId]);

  const handleClose = useCallback(() => {
    router.push(`/library/reels/${reelId}`);
  }, [router, reelId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!reel || reel.status !== 'developed') {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-hero)] gap-[var(--space-component)]">
        <p className="text-[var(--color-error)]">{error || 'Reel not ready for screening'}</p>
        <Button variant="secondary" onClick={() => router.push('/library')}>
          Back to Library
        </Button>
      </div>
    );
  }

  // In production, these would be signed R2 URLs
  const videoUrl = reel.assembled_storage_key || '';
  const posterUrl = reel.poster_storage_key || '';

  return (
    <ReelPlayer
      videoUrl={videoUrl}
      posterUrl={posterUrl}
      durationMs={reel.assembled_duration_ms ?? reel.current_duration_ms}
      filmProfile={reel.film_profile}
      isHearted={isHearted}
      onHeart={handleHeart}
      onShare={handleShare}
      onClose={handleClose}
    />
  );
}
