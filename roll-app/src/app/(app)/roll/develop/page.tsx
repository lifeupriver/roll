'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { FilmProfileSelector } from '@/components/roll/FilmProfileSelector';
import { FILM_PROFILES } from '@/types/roll';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/stores/toastStore';
import { ArrowLeft } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { Roll, FilmProfileId } from '@/types/roll';
import type { Photo } from '@/types/photo';

interface RollPhotoWithPhoto {
  id: string;
  roll_id: string;
  photo_id: string;
  position: number;
  processed_storage_key: string | null;
  correction_applied: boolean;
  created_at: string;
  photos: Photo;
}

export default function DevelopPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><Spinner size="lg" /></div>}>
      <DevelopPageContent />
    </Suspense>
  );
}

function DevelopPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const rollId = searchParams.get('rollId');
  const user = useUserStore((state) => state.user);
  const userTier = user?.tier ?? 'free';

  const [roll, setRoll] = useState<Roll | null>(null);
  const [photos, setPhotos] = useState<RollPhotoWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<FilmProfileId>('warmth');
  const [developing, setDeveloping] = useState(false);

  // Fetch roll data on mount
  useEffect(() => {
    if (!rollId) {
      setError('No roll ID provided');
      setLoading(false);
      return;
    }

    async function fetchRoll() {
      try {
        const response = await fetch(`/api/rolls/${rollId}`);
        if (!response.ok) {
          throw new Error('Failed to load roll');
        }
        const json = await response.json();
        setRoll(json.data.roll);
        setPhotos(json.data.photos);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load roll');
      } finally {
        setLoading(false);
      }
    }

    fetchRoll();
  }, [rollId]);

  // Handle profile selection with locked profile check
  function handleProfileChange(profileId: string) {
    const profile = FILM_PROFILES.find((p) => p.id === profileId);
    if (profile?.tier === 'plus' && userTier === 'free') {
      toast('Upgrade to Roll+ to unlock all film profiles', 'info');
      return;
    }
    setSelectedProfileId(profileId as FilmProfileId);
  }

  // Handle develop action
  async function handleDevelop() {
    if (!rollId || developing) return;

    setDeveloping(true);
    try {
      const response = await fetch('/api/process/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId, filmProfileId: selectedProfileId }),
      });

      if (!response.ok) {
        throw new Error('Failed to start development');
      }

      track({ event: 'roll_develop_started', properties: { rollId, filmProfile: selectedProfileId, photoCount: roll?.photo_count ?? 0 } });
      router.push(`/roll/${rollId}`);
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Failed to start development',
        'error',
      );
      setDeveloping(false);
    }
  }

  // Get the first photo thumbnail for preview
  const samplePhotoUrl = photos.length > 0 ? photos[0].photos.thumbnail_url : '';

  // Get selected profile's CSS filter class
  const selectedProfile = FILM_PROFILES.find((p) => p.id === selectedProfileId);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (error || !roll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-[var(--space-component)]">
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          {error || 'Roll not found'}
        </p>
        <Button variant="secondary" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {/* Header: Back button, roll name, photo count */}
      <div className="flex items-center gap-[var(--space-element)]">
        <button
          type="button"
          onClick={() => router.push(`/roll/${roll.id}`)}
          aria-label="Back to roll"
          className="shrink-0 p-[var(--space-tight)] rounded-[var(--radius-sharp)] text-[var(--color-ink-secondary)] hover:text-[var(--color-ink)] transition-colors duration-150"
        >
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="flex items-baseline gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)]">
            {roll.name || 'Untitled Roll'}
          </h1>
          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {roll.photo_count} photos
          </span>
        </div>
      </div>

      {/* Sample photo preview with selected film profile filter */}
      {samplePhotoUrl && (
        <div className="flex justify-center">
          <img
            src={samplePhotoUrl}
            alt="Sample photo preview"
            className={[
              'max-h-[400px] w-full object-contain rounded-[var(--radius-card)]',
              'shadow-[var(--shadow-floating)]',
              selectedProfile?.cssFilterClass ?? '',
            ].join(' ')}
          />
        </div>
      )}

      {/* Film profile selector */}
      <div>
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
          Choose Film Stock
        </h2>
        <FilmProfileSelector
          profiles={FILM_PROFILES}
          selectedId={selectedProfileId}
          onChange={handleProfileChange}
          samplePhotoUrl={samplePhotoUrl}
          userTier={userTier}
        />
      </div>

      {/* Develop CTA */}
      <Button
        variant="primary"
        size="lg"
        isLoading={developing}
        disabled={developing}
        onClick={handleDevelop}
      >
        {developing ? 'Developing...' : 'Develop This Roll'}
      </Button>

      {/* Processing time estimate */}
      <p className="text-center text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        ~2 minutes for {roll.photo_count} photos
      </p>
    </div>
  );
}
