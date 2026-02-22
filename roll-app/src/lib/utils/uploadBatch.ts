interface UploadFileInfo {
  file: File;
  storageKey: string;
  uploadUrl: string;
}

interface UploadResult {
  file: File;
  success: boolean;
  storageKey?: string;
  error?: string;
}

export async function uploadPhotos(
  files: File[],
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  // Step 1: Get presigned URLs
  const presignResponse = await fetch('/api/upload/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      files: files.map((f) => ({
        filename: f.name,
        contentType: f.type || 'image/jpeg',
        sizeBytes: f.size,
      })),
    }),
  });

  if (!presignResponse.ok) {
    const err = await presignResponse.json();
    throw new Error(err.error || 'Failed to get upload URLs');
  }

  const { uploads } = await presignResponse.json();

  const fileInfos: UploadFileInfo[] = files.map((file, i) => ({
    file,
    storageKey: uploads[i].storageKey,
    uploadUrl: uploads[i].uploadUrl,
  }));

  // Step 2: Upload files in parallel (max 5 concurrent)
  const results: UploadResult[] = [];
  let completed = 0;
  const concurrency = 5;

  async function uploadOne(info: UploadFileInfo): Promise<UploadResult> {
    let attempts = 0;
    const maxRetries = 2;

    while (attempts <= maxRetries) {
      try {
        const response = await fetch(info.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': info.file.type || 'image/jpeg' },
          body: info.file,
        });

        if (!response.ok) throw new Error(`Upload failed: ${response.status}`);

        completed++;
        onProgress?.(completed, files.length);
        return { file: info.file, success: true, storageKey: info.storageKey };
      } catch (err) {
        attempts++;
        if (attempts > maxRetries) {
          return {
            file: info.file,
            success: false,
            error: err instanceof Error ? err.message : 'Upload failed',
          };
        }
        await new Promise((r) => setTimeout(r, 1000 * attempts));
      }
    }

    return { file: info.file, success: false, error: 'Max retries exceeded' };
  }

  // Process in batches of 5
  for (let i = 0; i < fileInfos.length; i += concurrency) {
    const batch = fileInfos.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(uploadOne));
    results.push(...batchResults);
  }

  // Step 3: Complete upload for successful files
  const successfulUploads = results.filter((r) => r.success && r.storageKey);
  if (successfulUploads.length > 0) {
    await fetch('/api/upload/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photos: await Promise.all(
          successfulUploads.map(async (r) => {
            const arrayBuffer = await r.file.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const contentHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

            return {
              storageKey: r.storageKey,
              contentHash,
              filename: r.file.name,
              contentType: r.file.type || 'image/jpeg',
              sizeBytes: r.file.size,
              width: 0,
              height: 0,
              exifData: {},
            };
          })
        ),
      }),
    });
  }

  return results;
}
