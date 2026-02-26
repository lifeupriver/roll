'use client';

import { useState } from 'react';
import { GripVertical, Trash2, ChevronUp, ChevronDown, Type } from 'lucide-react';
import type { MagazinePage } from '@/types/magazine';

interface MagazinePageEditorProps {
  pages: MagazinePage[];
  photoUrlMap: Map<string, string>;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (pageIndex: number) => void;
  onCaptionChange: (pageIndex: number, caption: string) => void;
}

export function MagazinePageEditor({
  pages,
  photoUrlMap,
  onReorder,
  onRemove,
  onCaptionChange,
}: MagazinePageEditorProps) {
  const [editingCaption, setEditingCaption] = useState<number | null>(null);
  const [captionDraft, setCaptionDraft] = useState('');

  const startEditCaption = (index: number) => {
    setCaptionDraft(pages[index]?.caption || '');
    setEditingCaption(index);
  };

  const saveCaption = () => {
    if (editingCaption !== null) {
      onCaptionChange(editingCaption, captionDraft);
      setEditingCaption(null);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <h3 className="text-[length:var(--text-label)] font-medium text-[var(--color-ink-secondary)] uppercase tracking-wider mb-1">
        Pages ({pages.length})
      </h3>
      <div className="flex flex-col gap-1 max-h-[400px] overflow-y-auto">
        {pages.map((page, i) => {
          const firstPhotoUrl = page.photos[0] ? photoUrlMap.get(page.photos[0].id) : null;

          return (
            <div
              key={`page-${i}`}
              className="flex items-center gap-2 p-2 bg-[var(--color-surface-raised)] rounded-[var(--radius-sharp)] group"
            >
              <GripVertical size={14} className="text-[var(--color-ink-tertiary)] flex-shrink-0" />

              {/* Page thumbnail */}
              <div className="w-10 h-14 rounded-[var(--radius-sharp)] overflow-hidden flex-shrink-0 bg-[var(--color-surface-sunken)]">
                {page.type === 'divider' ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <Type size={12} className="text-[var(--color-ink-tertiary)]" />
                  </div>
                ) : firstPhotoUrl ? (
                  <img src={firstPhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>

              {/* Page info */}
              <div className="flex-1 min-w-0">
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)]">
                  {page.type === 'divider' ? page.title : `Page ${i + 1}`}
                </span>
                {editingCaption === i ? (
                  <input
                    type="text"
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    onBlur={saveCaption}
                    onKeyDown={(e) => e.key === 'Enter' && saveCaption()}
                    className="block w-full mt-0.5 px-1.5 py-0.5 text-[length:var(--text-caption)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded"
                    autoFocus
                    maxLength={200}
                    placeholder="Add caption..."
                  />
                ) : (
                  page.caption && (
                    <p
                      className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] truncate cursor-pointer hover:text-[var(--color-ink)]"
                      onClick={() => startEditCaption(i)}
                    >
                      {page.caption}
                    </p>
                  )
                )}
              </div>

              {/* Layout badge */}
              <span className="text-[9px] font-[family-name:var(--font-mono)] text-[var(--color-ink-tertiary)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 rounded flex-shrink-0">
                {page.photos.length}p · {page.layout.replace(/_/g, ' ')}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => startEditCaption(i)}
                  className="p-2.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] touch-target"
                  title="Edit caption"
                >
                  <Type size={14} />
                </button>
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => onReorder(i, i - 1)}
                    className="p-2.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] touch-target"
                    title="Move up"
                  >
                    <ChevronUp size={14} />
                  </button>
                )}
                {i < pages.length - 1 && (
                  <button
                    type="button"
                    onClick={() => onReorder(i, i + 1)}
                    className="p-2.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] touch-target"
                    title="Move down"
                  >
                    <ChevronDown size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  className="p-2.5 text-[var(--color-ink-tertiary)] hover:text-[var(--color-error)] touch-target"
                  title="Remove page"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
