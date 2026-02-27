'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { PhotoUpload } from '@/components/photo/PhotoUpload';
import { PrivacyPromise } from '@/components/onboarding/PrivacyPromise';

const TOTAL_STEPS = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [uploadCount, setUploadCount] = useState(0);
  const router = useRouter();

  function handleUploadComplete(count: number) {
    setUploadCount(count);
    setStep(4);
    // Auto-advance after processing simulation
    setTimeout(() => {
      setStep(5);
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
            Get started
          </Button>
        </div>
      )}

      {/* Step 2: Privacy Promise */}
      {step === 2 && <PrivacyPromise onContinue={() => setStep(3)} />}

      {/* Step 3: Upload */}
      {step === 3 && (
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

      {/* Step 4: Processing */}
      {step === 4 && (
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

      {/* Step 5: Backup confirmation */}
      {step === 5 && (
        <div className="flex flex-col items-center gap-[var(--space-section)] text-center max-w-md animate-[fadeIn_250ms_ease-out]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            Your library is ready
          </h2>
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            {uploadCount} photos uploaded. We filtered out the noise — here&apos;s what&apos;s worth
            keeping.
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-developed)] font-medium">
            Every photo you develop is automatically backed up and protected. Your best photos, safe
            forever.
          </p>
          <Button variant="primary" size="lg" onClick={() => setStep(6)}>
            Continue
          </Button>
        </div>
      )}

      {/* Step 6: Done — go to feed */}
      {step === 6 && (
        <div className="flex flex-col items-center gap-[var(--space-section)] text-center max-w-md animate-[fadeIn_250ms_ease-out]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-display)] text-[var(--color-ink)]">
            You&apos;re all set
          </h2>
          <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
            Browse your photos, select your favorites, and build your first roll of 36 — like
            loading a real roll of film.
          </p>
          <Button variant="primary" size="lg" onClick={() => router.push('/photos')}>
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
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
