'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Pencil, Check } from 'lucide-react';

interface CaptionEditorProps {
  caption: string;
  placeholder?: string;
  maxLength?: number;
  editable: boolean;
  onSave: (caption: string) => void;
  variant?: 'page' | 'cover';
}

export function CaptionEditor({
  caption,
  placeholder = 'Add a caption...',
  maxLength = 200,
  editable,
  onSave,
  variant = 'page',
}: CaptionEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(caption);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(caption);
  }, [caption]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    const trimmed = draft.trim();
    onSave(trimmed);
    setIsEditing(false);
  }, [draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setDraft(caption);
        setIsEditing(false);
      }
    },
    [handleSave, caption]
  );

  const isCover = variant === 'cover';

  if (isEditing) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            rows={isCover ? 3 : 2}
            maxLength={maxLength}
            placeholder={placeholder}
            className={`w-full px-[var(--space-element)] py-[var(--space-tight)] bg-[var(--color-surface-sunken)] border border-[var(--color-border-focus)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] resize-none transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-border-focus)] focus-visible:outline-offset-1 ${
              isCover
                ? 'font-[family-name:var(--font-display)] text-[length:var(--text-body)]'
                : 'font-[family-name:var(--font-body)] text-[length:var(--text-caption)]'
            }`}
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); handleSave(); }}
            className="absolute bottom-2 right-2 p-1 rounded-[var(--radius-sharp)] bg-[var(--color-action)] text-white hover:bg-[var(--color-action-hover)] transition-colors"
          >
            <Check size={12} />
          </button>
        </div>
        <span className="text-[length:10px] text-[var(--color-ink-tertiary)] text-right font-[family-name:var(--font-mono)]">
          {draft.length}/{maxLength}
        </span>
      </div>
    );
  }

  // Read mode
  if (caption) {
    return (
      <button
        type="button"
        onClick={() => editable && setIsEditing(true)}
        className={`text-left w-full group ${editable ? 'cursor-text' : 'cursor-default'}`}
      >
        <p
          className={`leading-relaxed ${
            isCover
              ? 'font-[family-name:var(--font-display)] text-[length:var(--text-body)] text-[var(--color-ink-secondary)]'
              : 'font-[family-name:var(--font-body)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic'
          }`}
        >
          {caption}
          {editable && (
            <Pencil
              size={10}
              className="inline-block ml-1.5 opacity-0 group-hover:opacity-60 transition-opacity text-[var(--color-ink-tertiary)]"
            />
          )}
        </p>
      </button>
    );
  }

  // Empty state
  if (editable) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 py-1 text-left group w-full"
      >
        <Pencil size={10} className="text-[var(--color-ink-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity" />
        <span
          className={`text-[var(--color-ink-tertiary)] opacity-60 group-hover:opacity-100 transition-opacity ${
            isCover
              ? 'font-[family-name:var(--font-display)] text-[length:var(--text-body)]'
              : 'font-[family-name:var(--font-body)] text-[length:var(--text-caption)] italic'
          }`}
        >
          {placeholder}
        </span>
      </button>
    );
  }

  return null;
}
