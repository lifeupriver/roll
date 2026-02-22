'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, X } from 'lucide-react';
import type { PhotoTag, Person } from '@/types/people';

interface PhotoTagOverlayProps {
  photoId: string;
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function PhotoTagOverlay({ photoId, isEditing, onToggleEdit }: PhotoTagOverlayProps) {
  const [tags, setTags] = useState<PhotoTag[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [newPersonName, setNewPersonName] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [pendingTag, setPendingTag] = useState<{ x: number; y: number } | null>(null);

  // Fetch tags and people
  useEffect(() => {
    async function load() {
      const [tagsRes, peopleRes] = await Promise.all([
        fetch(`/api/photos/${photoId}/tags`),
        fetch('/api/people'),
      ]);
      if (tagsRes.ok) {
        const { data } = await tagsRes.json();
        setTags(data ?? []);
      }
      if (peopleRes.ok) {
        const { data } = await peopleRes.json();
        setPeople(data ?? []);
      }
    }
    load();
  }, [photoId]);

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isEditing) {
        setShowTags(!showTags);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      setPendingTag({ x, y });
      setSelectedPersonId(null);
      setNewPersonName('');
    },
    [isEditing, showTags]
  );

  const handleCreateAndTag = async () => {
    if (!pendingTag || !newPersonName.trim()) return;

    // Create person
    const createRes = await fetch('/api/people', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newPersonName.trim() }),
    });

    if (!createRes.ok) return;
    const { data: person } = await createRes.json();
    setPeople((prev) => [...prev, person]);
    await addTag(person.id);
  };

  const handleTagPerson = async () => {
    if (!pendingTag || !selectedPersonId) return;
    await addTag(selectedPersonId);
  };

  const addTag = async (personId: string) => {
    if (!pendingTag) return;

    const tagRes = await fetch(`/api/photos/${photoId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personId,
        x: Math.max(0, pendingTag.x - 0.05),
        y: Math.max(0, pendingTag.y - 0.05),
        width: 0.1,
        height: 0.1,
      }),
    });

    if (tagRes.ok) {
      const { data: tag } = await tagRes.json();
      setTags((prev) => [...prev, tag]);
    }
    setPendingTag(null);
  };

  const handleDeleteTag = async (tagId: string) => {
    const res = await fetch(`/api/photos/${photoId}/tags`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tagId }),
    });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    }
  };

  return (
    <div className="relative w-full h-full" onClick={handleImageClick}>
      {/* Tag indicators */}
      {(showTags || isEditing) &&
        tags.map((tag) => (
          <div
            key={tag.id}
            className="absolute border-2 border-white/80 rounded-[var(--radius-sharp)] pointer-events-auto"
            style={{
              left: `${tag.x * 100}%`,
              top: `${tag.y * 100}%`,
              width: `${tag.width * 100}%`,
              height: `${tag.height * 100}%`,
            }}
          >
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
              {tag.person?.name || 'Unknown'}
            </span>
            {isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id);
                }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <X size={8} className="text-white" />
              </button>
            )}
          </div>
        ))}

      {/* Pending tag placement popup */}
      {pendingTag && isEditing && (
        <div
          className="absolute z-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-card)] shadow-[var(--shadow-floating)] p-[var(--space-element)] w-48"
          style={{
            left: `${Math.min(pendingTag.x * 100, 70)}%`,
            top: `${Math.min(pendingTag.y * 100, 70)}%`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] mb-[var(--space-tight)]">
            Tag a person
          </p>

          {/* Existing people */}
          {people.length > 0 && (
            <div className="flex flex-col gap-1 mb-[var(--space-tight)] max-h-24 overflow-y-auto">
              {people.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPersonId(p.id);
                    setNewPersonName('');
                  }}
                  className={`text-left text-[length:var(--text-caption)] px-2 py-1 rounded-[var(--radius-sharp)] transition-colors ${
                    selectedPersonId === p.id
                      ? 'bg-[var(--color-action-subtle)] text-[var(--color-action)]'
                      : 'hover:bg-[var(--color-surface-raised)] text-[var(--color-ink)]'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {/* New person */}
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newPersonName}
              onChange={(e) => {
                setNewPersonName(e.target.value);
                setSelectedPersonId(null);
              }}
              placeholder="New name..."
              maxLength={100}
              className="flex-1 h-7 px-2 text-[11px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] rounded-[var(--radius-sharp)] text-[var(--color-ink)] placeholder:text-[var(--color-ink-tertiary)] focus:outline-none focus:border-[var(--color-border-focus)]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 mt-[var(--space-tight)]">
            <button
              onClick={() => setPendingTag(null)}
              className="flex-1 h-7 text-[11px] text-[var(--color-ink-tertiary)] hover:text-[var(--color-ink)] rounded-[var(--radius-sharp)]"
            >
              Cancel
            </button>
            <button
              onClick={selectedPersonId ? handleTagPerson : handleCreateAndTag}
              disabled={!selectedPersonId && !newPersonName.trim()}
              className="flex-1 h-7 text-[11px] bg-[var(--color-action)] text-white rounded-[var(--radius-sharp)] disabled:opacity-30"
            >
              Tag
            </button>
          </div>
        </div>
      )}

      {/* Tag mode indicator */}
      {isEditing && (
        <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
          <Tag size={10} />
          Tap to tag
        </div>
      )}

      {/* Tag count badge */}
      {!isEditing && tags.length > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleEdit();
          }}
          className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1"
        >
          <Tag size={10} />
          {tags.length}
        </button>
      )}
    </div>
  );
}
