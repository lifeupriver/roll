'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronUp,
  ChevronDown,
  X,
  Type,
  Image,
  Film,
  Quote,
  Maximize,
  Grid2X2,
  Columns2,
  LayoutList,
} from 'lucide-react';
import type { BlogBlock, BlogBlockType } from '@/lib/design/design-engine';

const BLOCK_TYPE_LABELS: Record<BlogBlockType, { label: string; icon: typeof Image }> = {
  hero: { label: 'Hero', icon: Maximize },
  'photo-single': { label: 'Single Photo', icon: Image },
  panoramic: { label: 'Panoramic', icon: Maximize },
  'photo-pair': { label: 'Photo Pair', icon: Columns2 },
  'photo-triptych': { label: 'Triptych', icon: LayoutList },
  'photo-grid': { label: 'Photo Grid', icon: Grid2X2 },
  video: { label: 'Video', icon: Film },
  'video-pair': { label: 'Video Pair', icon: Film },
  pullquote: { label: 'Pull Quote', icon: Quote },
  text: { label: 'Text', icon: Type },
};

interface PostBlockEditorProps {
  blocks: BlogBlock[];
  photoMap: Map<string, { thumbnail_url: string; caption: string | null }>;
  videoMap: Map<string, { thumbnail_url: string; caption: string | null }>;
  onBlocksChange: (blocks: BlogBlock[]) => void;
}

export function PostBlockEditor({
  blocks,
  photoMap,
  videoMap,
  onBlocksChange,
}: PostBlockEditorProps) {
  const [editingTextIdx, setEditingTextIdx] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...blocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    onBlocksChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    onBlocksChange(blocks.filter((_, i) => i !== index));
  };

  const startEditText = (index: number) => {
    setEditingTextIdx(index);
    setEditText(blocks[index].text || '');
  };

  const saveEditText = () => {
    if (editingTextIdx === null) return;
    const newBlocks = [...blocks];
    newBlocks[editingTextIdx] = { ...newBlocks[editingTextIdx], text: editText };
    onBlocksChange(newBlocks);
    setEditingTextIdx(null);
    setEditText('');
  };

  const getBlockThumbnail = (block: BlogBlock): string | null => {
    if (block.photoIds.length > 0) {
      const photo = photoMap.get(block.photoIds[0]);
      return photo?.thumbnail_url || null;
    }
    if (block.videoIds.length > 0) {
      const video = videoMap.get(block.videoIds[0]);
      return video?.thumbnail_url || null;
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-[var(--space-tight)]">
      <div className="flex items-center justify-between mb-[var(--space-element)]">
        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-label)] text-[var(--color-ink-secondary)] uppercase tracking-[0.04em]">
          Content Blocks ({blocks.length})
        </h3>
      </div>

      {blocks.map((block, index) => {
        const typeInfo = BLOCK_TYPE_LABELS[block.type] || { label: block.type, icon: Image };
        const Icon = typeInfo.icon;
        const thumbnail = getBlockThumbnail(block);
        const isTextType = block.type === 'text' || block.type === 'pullquote';
        const isEditingThis = editingTextIdx === index;

        return (
          <div
            key={`block-${index}`}
            className="flex items-center gap-[var(--space-tight)] p-[var(--space-tight)] rounded-[var(--radius-sharp)] border border-[var(--color-border)] bg-[var(--color-surface)] group hover:border-[var(--color-border-focus)] transition-colors"
          >
            {/* Thumbnail or icon */}
            <div className="w-12 h-12 rounded-[var(--radius-sharp)] overflow-hidden bg-[var(--color-surface-sunken)] flex items-center justify-center shrink-0">
              {thumbnail ? (
                <Image
                  src={thumbnail}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <Icon size={16} className="text-[var(--color-ink-tertiary)]" />
              )}
            </div>

            {/* Block info */}
            <div className="flex-1 min-w-0">
              {isEditingThis ? (
                <textarea
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={saveEditText}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      saveEditText();
                    }
                  }}
                  rows={3}
                  className="w-full text-[length:var(--text-caption)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-ink)] resize-none focus:outline-none focus:border-[var(--color-action)]"
                />
              ) : (
                <>
                  <div className="flex items-center gap-[var(--space-tight)]">
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)] uppercase tracking-wider">
                      {typeInfo.label}
                    </span>
                    {block.photoIds.length > 1 && (
                      <span className="text-[10px] text-[var(--color-ink-tertiary)]">
                        {block.photoIds.length} photos
                      </span>
                    )}
                  </div>
                  {block.text && (
                    <button
                      type="button"
                      onClick={() => isTextType && startEditText(index)}
                      className={`text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] truncate block max-w-full text-left ${
                        isTextType ? 'hover:text-[var(--color-action)] cursor-pointer' : ''
                      }`}
                    >
                      {block.text.slice(0, 80)}
                      {block.text.length > 80 ? '...' : ''}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-0.5 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => moveBlock(index, 'up')}
                disabled={index === 0}
                className="w-7 h-7 flex items-center justify-center rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Move up"
              >
                <ChevronUp size={14} />
              </button>
              <button
                type="button"
                onClick={() => moveBlock(index, 'down')}
                disabled={index === blocks.length - 1}
                className="w-7 h-7 flex items-center justify-center rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-raised)] disabled:opacity-30 disabled:pointer-events-none transition-colors"
                aria-label="Move down"
              >
                <ChevronDown size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                className="w-7 h-7 flex items-center justify-center rounded text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] hover:bg-[var(--color-surface-raised)] transition-colors"
                aria-label="Remove block"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        );
      })}

      {blocks.length === 0 && (
        <div className="text-center py-[var(--space-component)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          No content blocks yet. Design your essay to generate blocks.
        </div>
      )}
    </div>
  );
}
