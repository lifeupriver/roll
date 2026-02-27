'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Pencil } from 'lucide-react';
import { CaptionEditor } from './CaptionEditor';

interface BookCoverProps {
  name: string;
  description: string;
  coverUrl: string | null;
  pageCount: number;
  editable: boolean;
  onNameChange?: (name: string) => void;
  onDescriptionChange?: (description: string) => void;
  onOpenBook: () => void;
}

export function BookCover({
  name,
  description,
  coverUrl,
  pageCount,
  editable,
  onNameChange,
  onDescriptionChange,
  onOpenBook,
}: BookCoverProps) {
  return (
    <div className="flex flex-col items-center gap-[var(--space-section)]">
      {/* Book cover card */}
      <button
        type="button"
        onClick={onOpenBook}
        className="relative w-full max-w-sm aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-overlay)] group cursor-pointer"
      >
        {/* Cover image */}
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-[var(--color-surface-sunken)] flex items-center justify-center">
            <BookOpen size={48} strokeWidth={1} className="text-[var(--color-ink-tertiary)]" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Spine effect on left edge */}
        <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/30 to-transparent" />

        {/* Title area */}
        <div className="absolute bottom-0 inset-x-0 p-5 flex flex-col gap-1.5">
          <h2 className="font-[family-name:var(--font-display)] font-semibold text-white text-[length:var(--text-title)] leading-tight drop-shadow-sm">
            {name || 'Untitled Book'}
          </h2>
          {description && (
            <p className="text-white/70 text-[length:var(--text-label)] leading-snug line-clamp-2 font-[family-name:var(--font-body)]">
              {description}
            </p>
          )}
          <p className="text-white/50 text-[length:var(--text-caption)] font-[family-name:var(--font-mono)] mt-1">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Open prompt */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white/20 backdrop-blur-sm rounded-[var(--radius-pill)] px-4 py-2">
            <span className="text-white text-[length:var(--text-label)] font-medium">
              Open Book
            </span>
          </div>
        </div>
      </button>

      {/* Editable metadata below cover */}
      {editable && (
        <div className="w-full max-w-sm flex flex-col gap-[var(--space-element)]">
          <div className="flex items-center gap-[var(--space-element)]">
            <EditableTitle value={name} onChange={onNameChange ?? (() => {})} />
          </div>
          <CaptionEditor
            caption={description}
            placeholder="Add a book description..."
            maxLength={300}
            editable
            onSave={onDescriptionChange ?? (() => {})}
            variant="cover"
          />
        </div>
      )}
    </div>
  );
}

function EditableTitle({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  // Avoid stale state - importing useState up top
  const handleSave = () => {
    onChange(draft.trim() || 'Untitled Book');
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        autoFocus
        maxLength={100}
        className="flex-1 font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] bg-transparent border-b-2 border-[var(--color-action)] outline-none py-0.5"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="flex items-center gap-2 group text-left"
    >
      <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
        {value || 'Untitled Book'}
      </h2>
      <Pencil
        size={14}
        className="text-[var(--color-ink-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity"
      />
    </button>
  );
}
