'use client';

import { useState } from 'react';
import { Copy, Check, Code } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmbedCodeGeneratorProps {
  slug: string;
  appUrl?: string;
}

export function EmbedCodeGenerator({ slug, appUrl }: EmbedCodeGeneratorProps) {
  const [copied, setCopied] = useState<'iframe' | 'link' | null>(null);
  const baseUrl = appUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://roll.photos';

  const iframeCode = `<iframe src="${baseUrl}/api/gallery/${slug}/embed" width="100%" height="600" frameborder="0" style="border-radius:8px;overflow:hidden;"></iframe>`;
  const directLink = `${baseUrl}/gallery/${slug}`;

  const copyToClipboard = async (text: string, type: 'iframe' | 'link') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="flex flex-col gap-[var(--space-component)]">
      <div className="flex items-center gap-2">
        <Code size={16} className="text-[var(--color-ink-tertiary)]" />
        <h3 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider">
          Embed Gallery
        </h3>
      </div>

      {/* Direct Link */}
      <div className="flex flex-col gap-[var(--space-tight)]">
        <label className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
          Direct Link
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={directLink}
            className="flex-1 px-3 py-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink)]"
          />
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(directLink, 'link')}>
            {copied === 'link' ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      </div>

      {/* Iframe embed code */}
      <div className="flex flex-col gap-[var(--space-tight)]">
        <label className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
          Embed Code (iframe)
        </label>
        <div className="flex items-start gap-2">
          <textarea
            readOnly
            value={iframeCode}
            rows={3}
            className="flex-1 px-3 py-2 bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink)] resize-none"
          />
          <Button variant="ghost" size="sm" onClick={() => copyToClipboard(iframeCode, 'iframe')}>
            {copied === 'iframe' ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      </div>
    </div>
  );
}
