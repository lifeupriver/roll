'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/stores/toastStore';
import { ArrowLeft, Wand2, Cloud, Zap } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { Roll } from '@/types/roll';
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
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      }
    >
      <DevelopPageContent />
    </Suspense>
  );
}

function DevelopPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const rollId = searchParams.get('rollId');

  const [roll, setRoll] = useState<Roll | null>(null);
  const [photos, setPhotos] = useState<RollPhotoWithPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [developing, setDeveloping] = useState(false);

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

  async function handleDevelop() {
    if (!rollId || developing) return;

    setDeveloping(true);
    try {
      const response = await fetch('/api/process/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId, filmProfileId: 'warmth' }),
      });

      if (!response.ok) {
        throw new Error('Failed to start development');
      }

      track({
        event: 'roll_develop_started',
        properties: { rollId, photoCount: roll?.photo_count ?? 0 },
      });
      router.push(`/roll/${rollId}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to start development', 'error');
      setDeveloping(false);
    }
  }

  // Show up to 4 sample thumbnails
  const samplePhotos = photos.slice(0, 4);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

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
      {/* Header */}
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
            Develop Roll
          </h1>
          <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            {roll.photo_count} photos
          </span>
        </div>
      </div>

      {/* Photo grid preview */}
      {samplePhotos.length > 0 && (
        <div className="grid grid-cols-2 gap-1 rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-floating)]">
          {samplePhotos.map((rp) => (
            <img
              key={rp.id}
              src={rp.photos.thumbnail_url}
              alt=""
              className="w-full aspect-[4/3] object-cover"
            />
          ))}
        </div>
      )}

      {/* AI development info card */}
      <div className="flex flex-col gap-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-action)]/10">
            <Wand2 size={20} className="text-[var(--color-action)]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              AI Color Correction
            </h2>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              Cloud-powered per-photo AI
            </p>
          </div>
        </div>

        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-relaxed">
          Your photos are sent to the cloud where AI analyzes each image individually — correcting
          exposure, white balance, color, and tone. Developed JPGs are delivered to your library.
        </p>

        <div className="flex flex-wrap gap-[var(--space-element)]">
          <Badge variant="action">
            <Cloud size={12} className="mr-0.5 inline" />
            Cloud processed
          </Badge>
          <Badge variant="developed">
            <Zap size={12} className="mr-0.5 inline" />
            Per-photo AI
          </Badge>
        </div>
      </div>

      {/* Develop CTA */}
      <Button
        variant="primary"
        size="lg"
        isLoading={developing}
        disabled={developing}
        onClick={handleDevelop}
      >
        {developing ? 'Developing...' : `Develop ${roll.photo_count} Photos`}
      </Button>

      <p className="text-center text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        Color-corrected JPGs will appear in your library
      </p>
    </div>
  );
}
