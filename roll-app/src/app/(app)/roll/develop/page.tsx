'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/stores/toastStore';
import { Wand2, Cloud, Zap, Sun, Moon } from 'lucide-react';
import { BackButton } from '@/components/ui/BackButton';
import { track } from '@/lib/analytics';
import type { Roll } from '@/types/roll';
import Image from 'next/image';
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
  const [processMode, setProcessMode] = useState<'color' | 'bw'>('color');

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
      const filmProfileId = processMode === 'bw' ? 'classic' : 'warmth';
      const response = await fetch('/api/process/develop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollId, filmProfileId, processMode }),
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
        <BackButton href={`/roll/${roll.id}`} label="Back to roll" />
        <div className="flex items-baseline gap-[var(--space-element)]">
          <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
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
            <Image
              key={rp.id}
              src={rp.photos.thumbnail_url}
              alt=""
              width={400}
              height={300}
              className="w-full aspect-[4/3] object-cover"
              unoptimized
            />
          ))}
        </div>
      )}

      {/* Processing mode — Color vs B&W */}
      <div className="flex flex-col gap-[var(--space-element)]">
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
          Choose your look
        </h2>
        <div className="grid grid-cols-2 gap-[var(--space-element)]">
          {/* Color option */}
          <button
            type="button"
            onClick={() => setProcessMode('color')}
            className={`relative flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-all ${
              processMode === 'color'
                ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-ink-tertiary)]'
            }`}
          >
            {/* Preview thumbnails with color tint */}
            <div className="grid grid-cols-2 gap-0.5 w-full rounded-[var(--radius-sharp)] overflow-hidden">
              {samplePhotos.slice(0, 4).map((rp) => (
                <Image
                  key={`color-${rp.id}`}
                  src={rp.photos.thumbnail_url}
                  alt=""
                  width={200}
                  height={200}
                  className="w-full aspect-square object-cover"
                  unoptimized
                />
              ))}
            </div>
            <div className="flex items-center gap-[var(--space-tight)]">
              <Sun
                size={18}
                className={
                  processMode === 'color'
                    ? 'text-[var(--color-action)]'
                    : 'text-[var(--color-ink-secondary)]'
                }
              />
              <span
                className={`text-[length:var(--text-label)] font-medium ${processMode === 'color' ? 'text-[var(--color-action)]' : 'text-[var(--color-ink)]'}`}
              >
                Color
              </span>
            </div>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
              Warm tones, natural color correction
            </p>
            {processMode === 'color' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-action)] flex items-center justify-center">
                <Zap size={12} className="text-white" />
              </div>
            )}
          </button>

          {/* B&W option */}
          <button
            type="button"
            onClick={() => setProcessMode('bw')}
            className={`relative flex flex-col items-center gap-[var(--space-element)] p-[var(--space-component)] rounded-[var(--radius-card)] border-2 transition-all ${
              processMode === 'bw'
                ? 'border-[var(--color-ink)] bg-[var(--color-surface-sunken)]'
                : 'border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-ink-tertiary)]'
            }`}
          >
            {/* Preview thumbnails with grayscale filter */}
            <div className="grid grid-cols-2 gap-0.5 w-full rounded-[var(--radius-sharp)] overflow-hidden">
              {samplePhotos.slice(0, 4).map((rp) => (
                <Image
                  key={`bw-${rp.id}`}
                  src={rp.photos.thumbnail_url}
                  alt=""
                  width={200}
                  height={200}
                  className="w-full aspect-square object-cover grayscale contrast-110"
                  style={{ filter: 'grayscale(100%) contrast(1.1)' }}
                  unoptimized
                />
              ))}
            </div>
            <div className="flex items-center gap-[var(--space-tight)]">
              <Moon
                size={18}
                className={
                  processMode === 'bw'
                    ? 'text-[var(--color-ink)]'
                    : 'text-[var(--color-ink-secondary)]'
                }
              />
              <span
                className={`text-[length:var(--text-label)] font-medium ${processMode === 'bw' ? 'text-[var(--color-ink)]' : 'text-[var(--color-ink)]'}`}
              >
                Black & White
              </span>
            </div>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center">
              Classic B&W with rich tonal range
            </p>
            {processMode === 'bw' && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--color-ink)] flex items-center justify-center">
                <Moon size={12} className="text-white" />
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Development info card */}
      <div className="flex flex-col gap-[var(--space-component)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)]">
        <div className="flex items-center gap-[var(--space-element)]">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-action)]/10">
            <Wand2 size={20} className="text-[var(--color-action)]" />
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
              {processMode === 'bw'
                ? 'Professional B&W Conversion'
                : 'Professional Color Correction'}
            </h2>
            <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
              Cloud-powered per-photo processing
            </p>
          </div>
        </div>

        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-relaxed">
          {processMode === 'bw'
            ? 'Your photos are converted to black & white with optimized tonal adjustments — enhancing contrast, highlights, and shadow detail for a classic film look.'
            : 'Your photos are sent to the cloud where each image is analyzed individually — correcting exposure, white balance, color, and tone. Developed JPGs are delivered to your gallery.'}
        </p>

        <div className="flex flex-wrap gap-[var(--space-element)]">
          <Badge variant="action">
            <Cloud size={12} className="mr-0.5 inline" />
            Cloud processed
          </Badge>
          <Badge variant="developed">
            <Zap size={12} className="mr-0.5 inline" />
            Per-photo correction
          </Badge>
          <Badge variant={processMode === 'bw' ? 'processing' : 'action'}>
            {processMode === 'bw' ? (
              <>
                <Moon size={12} className="mr-0.5 inline" /> Black & White
              </>
            ) : (
              <>
                <Sun size={12} className="mr-0.5 inline" /> Color
              </>
            )}
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
        {developing
          ? 'Developing...'
          : `Develop ${roll.photo_count} Photos in ${processMode === 'bw' ? 'B&W' : 'Color'}`}
      </Button>

      <p className="text-center text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
        {processMode === 'bw' ? 'B&W' : 'Color-corrected'} JPGs will appear in your gallery
      </p>
    </div>
  );
}
