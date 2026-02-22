'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { uploadPhotos } from '@/lib/utils/uploadBatch';
import { ALLOWED_CONTENT_TYPES, MAX_FILE_SIZE_BYTES } from '@/lib/utils/constants';

interface PhotoUploadProps {
  onUploadComplete?: (count: number) => void;
}

export function PhotoUpload({ onUploadComplete }: PhotoUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback((fileList: FileList | File[]): File[] => {
    const valid: File[] = [];
    const allowedTypes = ALLOWED_CONTENT_TYPES as readonly string[];

    for (const file of Array.from(fileList)) {
      if (!allowedTypes.includes(file.type)) {
        setError(`Unsupported format: ${file.name}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setError(`File too large: ${file.name} (max 50MB)`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const valid = validateFiles(e.target.files);
      setFiles(valid);
      setError(null);
      setSuccess(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      const valid = validateFiles(e.dataTransfer.files);
      setFiles(valid);
      setError(null);
      setSuccess(false);
    }
  }

  async function handleUpload() {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setProgress({ completed: 0, total: files.length });

    try {
      const results = await uploadPhotos(files, (completed, total) => {
        setProgress({ completed, total });
      });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount > 0) {
        setError(`${failCount} file(s) failed to upload`);
      }

      if (successCount > 0) {
        setSuccess(true);
        onUploadComplete?.(successCount);
      }

      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-component)]">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-[var(--space-component)] p-[var(--space-hero)] border-2 border-dashed rounded-[var(--radius-card)] cursor-pointer transition-colors duration-200 ${
          isDragOver
            ? 'border-[var(--color-action)] bg-[var(--color-action-subtle)]'
            : 'border-[var(--color-border-strong)] hover:border-[var(--color-action)] hover:bg-[var(--color-surface-raised)]'
        }`}
      >
        <Upload size={48} strokeWidth={1.5} className="text-[var(--color-ink-tertiary)]" />
        <div className="text-center">
          <p className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
            Drop photos here
          </p>
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mt-[var(--space-tight)]">
            or click to browse. JPEG, HEIC, PNG, WebP up to 50MB.
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/heic,image/heif,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Selected files count */}
      {files.length > 0 && !uploading && (
        <div className="flex items-center justify-between">
          <span className="text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
            {files.length} photo{files.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-[var(--space-tight)]">
            <Button variant="ghost" size="sm" onClick={() => setFiles([])}>
              <X size={16} className="mr-1" /> Clear
            </Button>
            <Button variant="primary" size="sm" onClick={handleUpload}>
              Upload
            </Button>
          </div>
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="flex flex-col gap-[var(--space-tight)]">
          <div className="flex items-center justify-between text-[length:var(--text-label)]">
            <span className="text-[var(--color-ink-secondary)]">Uploading...</span>
            <span className="font-[family-name:var(--font-mono)] text-[var(--color-processing)]">
              {progress.completed} / {progress.total}
            </span>
          </div>
          <div className="h-2 bg-[var(--color-surface-sunken)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-action)] transition-all duration-200 ease-out rounded-full"
              style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-[var(--space-tight)] text-[var(--color-error)] text-[length:var(--text-caption)]">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Success message */}
      {success && (
        <div className="flex items-center gap-[var(--space-tight)] text-[var(--color-developed)] text-[length:var(--text-caption)]">
          <CheckCircle size={16} />
          Photos uploaded successfully! Your library is being analyzed.
        </div>
      )}
    </div>
  );
}
