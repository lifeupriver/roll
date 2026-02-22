'use client';

import { useRouter } from 'next/navigation';
import { PhotoUpload } from '@/components/photo/PhotoUpload';

export default function UploadPage() {
  const router = useRouter();

  function handleComplete(count: number) {
    if (count > 0) {
      router.push('/feed');
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      <div>
        <h1 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)]">
          Upload Photos
        </h1>
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] mt-[var(--space-tight)]">
          Add photos to your library. We&apos;ll automatically filter out screenshots, blurry shots, and duplicates.
        </p>
      </div>
      <PhotoUpload onUploadComplete={handleComplete} />
    </div>
  );
}
