'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import Image from 'next/image';
import { GripVertical, Volume2, VolumeX, Scissors, X } from 'lucide-react';
import { formatDuration } from './ClipDurationBadge';
import type { ReelClip, TransitionType } from '@/types/reel';
import type { Photo } from '@/types/photo';

// ─── Types ───────────────────────────────────────────────────────────────────

interface TimelineClip extends ReelClip {
  photos?: Photo;
}

interface NLETimelineProps {
  clips: TimelineClip[];
  totalDurationMs: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (photoId: string) => void;
  onEditTrim: (clipId: string) => void;
  onAudioToggle: (clipId: string, enabled: boolean) => void;
  onTransitionChange: (clipId: string, transition: TransitionType) => void;
  readOnly?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_CLIP_WIDTH_PX = 60;
const TRACK_HEIGHT_PX = 80;

const TRANSITION_LABELS: Record<TransitionType, string> = {
  crossfade: 'X',
  cut: '|',
  dip_to_black: 'B',
};

const TRANSITION_TOOLTIPS: Record<TransitionType, string> = {
  crossfade: 'Crossfade',
  cut: 'Hard cut',
  dip_to_black: 'Dip to black',
};

// ─── NLE Timeline Component ──────────────────────────────────────────────────

export function NLETimeline({
  clips,
  totalDurationMs,
  onReorder,
  onRemove,
  onEditTrim,
  onAudioToggle,
  onTransitionChange,
  readOnly = false,
}: NLETimelineProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [hoveredClip, setHoveredClip] = useState<string | null>(null);

  // Calculate proportional widths for each clip
  const effectiveDuration = totalDurationMs > 0 ? totalDurationMs : 1;
  const clipWidths = useMemo(() => {
    return clips.map((c) =>
      Math.max(
        (c.trimmed_duration_ms / effectiveDuration) * 100,
        2 // Minimum 2% width
      )
    );
  }, [clips, effectiveDuration]);

  // Drag handlers
  const handleDragStart = useCallback(
    (index: number) => {
      if (readOnly) return;
      setDragIndex(index);
    },
    [readOnly]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (readOnly) return;
      e.preventDefault();
      setOverIndex(index);
    },
    [readOnly]
  );

  const handleDrop = useCallback(
    (index: number) => {
      if (dragIndex !== null && dragIndex !== index) {
        onReorder(dragIndex, index);
      }
      setDragIndex(null);
      setOverIndex(null);
    },
    [dragIndex, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setOverIndex(null);
  }, []);

  // Cycle transition type
  const cycleTransition = useCallback(
    (clipId: string, current: TransitionType) => {
      const types: TransitionType[] = ['crossfade', 'cut', 'dip_to_black'];
      const nextIdx = (types.indexOf(current) + 1) % types.length;
      onTransitionChange(clipId, types[nextIdx]);
    },
    [onTransitionChange]
  );

  if (clips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-[var(--space-section)] gap-[var(--space-element)]">
        <p className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)]">
          No clips in timeline
        </p>
        <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
          Select video clips to add them to your reel.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-[var(--space-element)]">
      {/* Timecode ruler */}
      <div className="flex items-end h-5 px-1 relative">
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <span
            key={pct}
            className="absolute text-[9px] font-[family-name:var(--font-mono)] text-[var(--color-ink-tertiary)] tabular-nums"
            style={{ left: `${pct * 100}%`, transform: 'translateX(-50%)' }}
          >
            {formatDuration(Math.round(pct * totalDurationMs))}
          </span>
        ))}
      </div>

      {/* Main track */}
      <div
        ref={trackRef}
        className="relative flex items-stretch bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] overflow-hidden"
        style={{ height: TRACK_HEIGHT_PX }}
      >
        {clips.map((clip, index) => {
          const thumbnailUrl = clip.photos?.thumbnail_url || '';
          const isDragging = dragIndex === index;
          const isDropTarget = overIndex === index && dragIndex !== null;
          const isHovered = hoveredClip === clip.id;
          const audioOn = clip.audio_enabled !== false;

          return (
            <div
              key={clip.id}
              className="relative group"
              style={{ width: `${clipWidths[index]}%`, minWidth: MIN_CLIP_WIDTH_PX }}
              draggable={!readOnly}
              onDragStart={readOnly ? undefined : () => handleDragStart(index)}
              onDragOver={readOnly ? undefined : (e) => handleDragOver(e, index)}
              onDrop={readOnly ? undefined : () => handleDrop(index)}
              onDragEnd={readOnly ? undefined : handleDragEnd}
              onMouseEnter={() => setHoveredClip(clip.id)}
              onMouseLeave={() => setHoveredClip(null)}
            >
              {/* Clip visual */}
              <div
                className={[
                  'absolute inset-0 overflow-hidden transition-all duration-150',
                  index === 0 ? 'rounded-l-[var(--radius-card)]' : '',
                  index === clips.length - 1 ? 'rounded-r-[var(--radius-card)]' : '',
                  isDragging ? 'opacity-40 scale-y-90' : '',
                  isDropTarget ? 'ring-2 ring-inset ring-[var(--color-action)]' : '',
                  'border-r border-[var(--color-surface-sunken)]',
                ].join(' ')}
              >
                {/* Thumbnail background */}
                {thumbnailUrl ? (
                  <Image src={thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <div className="absolute inset-0 bg-[var(--color-surface-raised)]" />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />

                {/* Position badge */}
                <span className="absolute top-1 left-1 px-1 py-0.5 bg-[var(--color-action)] rounded-full font-[family-name:var(--font-mono)] text-[9px] text-white font-bold tabular-nums leading-none">
                  {clip.position}
                </span>

                {/* Audio indicator */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!readOnly) onAudioToggle(clip.id, !audioOn);
                  }}
                  className={`absolute top-1 right-1 p-0.5 rounded-sm transition-colors ${
                    audioOn ? 'text-white/80 hover:text-white' : 'text-red-400 hover:text-red-300'
                  }`}
                  title={audioOn ? 'Mute this clip' : 'Unmute this clip'}
                >
                  {audioOn ? <Volume2 size={11} /> : <VolumeX size={11} />}
                </button>

                {/* Duration at bottom */}
                <span className="absolute bottom-1 left-1 font-[family-name:var(--font-mono)] text-[9px] text-white/80 tabular-nums leading-none">
                  {formatDuration(clip.trimmed_duration_ms)}
                </span>

                {/* Clip actions (on hover) */}
                {isHovered && !readOnly && (
                  <div className="absolute bottom-1 right-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTrim(clip.id);
                      }}
                      className="p-0.5 bg-black/50 rounded-sm text-white/80 hover:text-white backdrop-blur-sm"
                      title="Trim clip"
                    >
                      <Scissors size={10} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(clip.photo_id);
                      }}
                      className="p-0.5 bg-black/50 rounded-sm text-white/80 hover:text-red-400 backdrop-blur-sm"
                      title="Remove clip"
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}

                {/* Drag handle */}
                {!readOnly && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical size={16} className="text-white rotate-90" />
                  </div>
                )}
              </div>

              {/* Transition badge between clips */}
              {index < clips.length - 1 && !readOnly && (
                <button
                  type="button"
                  onClick={() => cycleTransition(clip.id, clip.transition_type)}
                  className="absolute -right-[14px] top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[9px] font-bold text-[var(--color-ink-secondary)] hover:border-[var(--color-action)] hover:text-[var(--color-action)] transition-colors shadow-sm"
                  title={`Transition: ${TRANSITION_TOOLTIPS[clip.transition_type]}. Click to change.`}
                >
                  {TRANSITION_LABELS[clip.transition_type]}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Clip detail strip (below timeline) */}
      <div className="flex gap-px">
        {clips.map((clip, index) => {
          const trimmed = clip.trim_start_ms > 0 || clip.trim_end_ms !== null;
          return (
            <div
              key={clip.id}
              className="flex-1 min-w-0 text-center"
              style={{ flexBasis: `${clipWidths[index]}%` }}
            >
              <p className="text-[9px] text-[var(--color-ink-tertiary)] truncate font-[family-name:var(--font-mono)] tabular-nums">
                {trimmed
                  ? `${formatDuration(clip.trim_start_ms)}–${formatDuration(clip.trim_end_ms ?? clip.trimmed_duration_ms + clip.trim_start_ms)}`
                  : ''}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
