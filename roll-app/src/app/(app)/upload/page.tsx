'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhotoUpload } from '@/components/photo/PhotoUpload';
import { CameraCapture } from '@/components/photo/CameraCapture';
import { uploadPhotos } from '@/lib/utils/uploadBatch';
import { useToast } from '@/stores/toastStore';

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [cameraUploading, setCameraUploading] = useState(false);

  function handleComplete(count: number) {
    if (count > 0) {
      router.push('/feed');
    }
  }

  async function handleCameraPhotos(files: File[]) {
    if (files.length === 0) return;
    setCameraUploading(true);
    try {
      const results = await uploadPhotos(files, () => {});
      const successCount = results.filter((r) => r.success).length;
      if (successCount > 0) {
        toast(`${successCount} photo${successCount !== 1 ? 's' : ''} uploaded from camera`, 'success');
        router.push('/feed');
      }
    } catch {
      toast('Failed to upload camera photos', 'error');
    } finally {
      setCameraUploading(false);
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

      {/* Camera + Upload options */}
      <div className="flex items-center gap-[var(--space-component)]">
        <CameraCapture onPhotosReady={handleCameraPhotos} />
        {cameraUploading && (
          <span className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Uploading camera photos...
          </span>
        )}
      </div>

      <PhotoUpload onUploadComplete={handleComplete} />
    </div>
  );
}
