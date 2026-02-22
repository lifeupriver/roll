'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PhotoUpload } from '@/components/photo/PhotoUpload';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [uploadCount, setUploadCount] = useState(0);
  const router = useRouter();

  function handleUploadComplete(count: number) {
    setUploadCount(count);
    setStep(3);
    // Auto-advance after processing simulation
    setTimeout(() => {
      setStep(4);
    }, 3000);
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-[var(--space-component)]">
      {/* Step 1: Welcome */}
      {step === 1 && (
        <div className="flex flex-col items-center gap-[var(--space-section)] text-center max-w-md animate-[fadeIn_250ms_ease-out]">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)]">
            ROLL
          </h1>
          <p className="type-display text-[var(--color-ink)]">
            Your photos deserve better than a camera roll.
          </p>
          <Button variant="primary" size="lg" onClick={() => setStep(2)}>
            Upload your first roll
          </Button>
        </div>
      )}

      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="w-full max-w-lg flex flex-col gap-[var(--space-section)] animate-[fadeIn_250ms_ease-out]">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
              Upload your photos
            </h2>
            <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] mt-[var(--space-tight)]">
              We&apos;ll clean up the noise — screenshots, blurry shots, duplicates.
            </p>
          </div>
          <PhotoUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

      {/* Step 3: Processing */}
      {step === 3 && (
        <div className="flex flex-col items-center gap-[var(--space-section)] text-center animate-[fadeIn_250ms_ease-out]">
          <Spinner size="lg" />
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            Cleaning up your library...
          </h2>
          <p className="font-[family-name:var(--font-mono)] text-[length:var(--text-label)] text-[var(--color-processing)]">
            Analyzing {uploadCount} photos
          </p>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 4 && (
        <div className="flex flex-col items-center gap-[var(--space-section)] text-center max-w-md animate-[fadeIn_250ms_ease-out]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            Your library is ready
          </h2>
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            {uploadCount} photos uploaded. We filtered out the noise — here&apos;s what&apos;s worth keeping.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.push('/feed')}>
            Start browsing
          </Button>
        </div>
      )}

      {/* Film strip progress indicator */}
      <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 px-[var(--space-component)] lg:pl-64">
        <div className="max-w-[1200px] mx-auto">
          <div className="h-1 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-action)] transition-all duration-500 ease-out rounded-full"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
