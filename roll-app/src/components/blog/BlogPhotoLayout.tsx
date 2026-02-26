'use client';

import type { BlogBlock } from '@/lib/design/design-engine';
import { Play } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
}

interface BlogVideo {
  id: string;
  thumbnail_url: string;
  video_url: string;
  width: number;
  height: number;
  caption: string | null;
  duration_ms: number | null;
}

interface BlogPhotoLayoutProps {
  /** Smart design blocks from the design engine. */
  blocks: BlogBlock[];
  /** Photo lookup by ID. */
  photoMap: Map<string, BlogPhoto>;
  /** Video lookup by ID. */
  videoMap: Map<string, BlogVideo>;
  /** Legacy: raw photos array (fallback when blocks aren't provided). */
  photos?: BlogPhoto[];
  /** Story text (rendered inline by the design engine). */
  story?: string | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BlogPhotoLayout({ blocks, photoMap, videoMap, photos, story }: BlogPhotoLayoutProps) {
  // Fallback: if no blocks, use legacy photo-only layout
  if ((!blocks || blocks.length === 0) && photos && photos.length > 0) {
    return <LegacyPhotoLayout photos={photos} />;
  }

  if (!blocks || blocks.length === 0) return null;

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {blocks.map((block, i) => (
        <BlogBlockRenderer
          key={`block-${i}`}
          block={block}
          photoMap={photoMap}
          videoMap={videoMap}
        />
      ))}
    </div>
  );
}

// ─── Block Renderer ───────────────────────────────────────────────────────────

function BlogBlockRenderer({
  block,
  photoMap,
  videoMap,
}: {
  block: BlogBlock;
  photoMap: Map<string, BlogPhoto>;
  videoMap: Map<string, BlogVideo>;
}) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock block={block} photoMap={photoMap} />;
    case 'photo-single':
      return <SinglePhotoBlock block={block} photoMap={photoMap} />;
    case 'panoramic':
      return <PanoramicBlock block={block} photoMap={photoMap} />;
    case 'photo-pair':
      return <PhotoPairBlock block={block} photoMap={photoMap} />;
    case 'photo-triptych':
      return <PhotoTriptychBlock block={block} photoMap={photoMap} />;
    case 'photo-grid':
      return <PhotoGridBlock block={block} photoMap={photoMap} />;
    case 'video':
      return <VideoBlock block={block} videoMap={videoMap} />;
    case 'pullquote':
      return <PullQuoteBlock block={block} />;
    case 'text':
      return <TextBlock block={block} />;
    default:
      return null;
  }
}

// ─── Hero Block ───────────────────────────────────────────────────────────────
// Full-width dramatic image with generous vertical spacing.

function HeroBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photo = block.photoIds[0] ? photoMap.get(block.photoIds[0]) : null;
  if (!photo) return null;

  return (
    <figure>
      <img
        src={photo.developed_url || photo.thumbnail_url}
        alt={photo.caption || ''}
        className="w-full rounded-[var(--radius-card)]"
        style={{
          aspectRatio: photo.width && photo.height
            ? `${photo.width}/${photo.height}`
            : undefined,
        }}
        loading="eager"
      />
      {photo.caption && (
        <figcaption className="mt-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center font-[family-name:var(--font-display)] italic">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Single Photo Block ──────────────────────────────────────────────────────
// Full-width photo at natural aspect ratio. Never cropped.

function SinglePhotoBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photo = block.photoIds[0] ? photoMap.get(block.photoIds[0]) : null;
  if (!photo) return null;

  return (
    <figure>
      <img
        src={photo.developed_url || photo.thumbnail_url}
        alt={photo.caption || ''}
        className="w-full rounded-[var(--radius-sharp)]"
        style={{
          aspectRatio: photo.width && photo.height
            ? `${photo.width}/${photo.height}`
            : undefined,
        }}
        loading="lazy"
      />
      {photo.caption && (
        <figcaption className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Panoramic Block ─────────────────────────────────────────────────────────
// Ultra-wide photos with extra vertical breathing room.

function PanoramicBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photo = block.photoIds[0] ? photoMap.get(block.photoIds[0]) : null;
  if (!photo) return null;

  return (
    <figure className="my-[var(--space-component)]">
      <img
        src={photo.developed_url || photo.thumbnail_url}
        alt={photo.caption || ''}
        className="w-full rounded-[var(--radius-sharp)]"
        style={{
          aspectRatio: photo.width && photo.height
            ? `${photo.width}/${photo.height}`
            : undefined,
        }}
        loading="lazy"
      />
      {photo.caption && (
        <figcaption className="mt-[var(--space-element)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center font-[family-name:var(--font-display)] italic">
          {photo.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Photo Pair Block ────────────────────────────────────────────────────────
// Two photos side-by-side, each shown at natural aspect ratio.
// Heights are matched by the tallest photo, with the shorter one centered.

function PhotoPairBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photos = block.photoIds.map(id => photoMap.get(id)).filter(Boolean) as BlogPhoto[];
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-[var(--space-element)] items-center">
      {photos.map((photo) => (
        <figure key={photo.id}>
          <img
            src={photo.developed_url || photo.thumbnail_url}
            alt={photo.caption || ''}
            className="w-full rounded-[var(--radius-sharp)]"
            style={{
              aspectRatio: photo.width && photo.height
                ? `${photo.width}/${photo.height}`
                : undefined,
            }}
            loading="lazy"
          />
          {photo.caption && (
            <figcaption className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

// ─── Photo Triptych Block ────────────────────────────────────────────────────
// Three photos in a row, editorial magazine feel.

function PhotoTriptychBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photos = block.photoIds.map(id => photoMap.get(id)).filter(Boolean) as BlogPhoto[];
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-[var(--space-element)] items-center">
      {photos.map((photo) => (
        <figure key={photo.id}>
          <img
            src={photo.developed_url || photo.thumbnail_url}
            alt={photo.caption || ''}
            className="w-full rounded-[var(--radius-sharp)]"
            style={{
              aspectRatio: photo.width && photo.height
                ? `${photo.width}/${photo.height}`
                : undefined,
            }}
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  );
}

// ─── Photo Grid Block ────────────────────────────────────────────────────────
// 4+ photos in a 2-column grid.

function PhotoGridBlock({ block, photoMap }: { block: BlogBlock; photoMap: Map<string, BlogPhoto> }) {
  const photos = block.photoIds.map(id => photoMap.get(id)).filter(Boolean) as BlogPhoto[];
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-[var(--space-element)]">
      {photos.map((photo) => (
        <figure key={photo.id}>
          <img
            src={photo.developed_url || photo.thumbnail_url}
            alt={photo.caption || ''}
            className="w-full rounded-[var(--radius-sharp)]"
            style={{
              aspectRatio: photo.width && photo.height
                ? `${photo.width}/${photo.height}`
                : undefined,
            }}
            loading="lazy"
          />
        </figure>
      ))}
    </div>
  );
}

// ─── Video Block ─────────────────────────────────────────────────────────────
// Inline video with poster frame and play button overlay.

function VideoBlock({ block, videoMap }: { block: BlogBlock; videoMap: Map<string, BlogVideo> }) {
  const video = block.videoIds[0] ? videoMap.get(block.videoIds[0]) : null;
  if (!video) return null;

  const aspectRatio = video.width && video.height
    ? `${video.width}/${video.height}`
    : '16/9';

  const durationLabel = video.duration_ms
    ? formatDuration(video.duration_ms)
    : null;

  return (
    <figure className="my-[var(--space-element)]">
      <div className="relative rounded-[var(--radius-card)] overflow-hidden group">
        <video
          src={video.video_url}
          poster={video.thumbnail_url}
          className="w-full"
          style={{ aspectRatio }}
          controls
          preload="metadata"
          playsInline
        />

        {/* Duration badge */}
        {durationLabel && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/60 rounded-[var(--radius-pill)] pointer-events-none">
            <span className="font-[family-name:var(--font-mono)] text-[10px] text-white">
              {durationLabel}
            </span>
          </div>
        )}
      </div>
      {video.caption && (
        <figcaption className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic">
          {video.caption}
        </figcaption>
      )}
    </figure>
  );
}

// ─── Pull Quote Block ────────────────────────────────────────────────────────
// A standout quote/caption displayed as a typographic centerpiece.

function PullQuoteBlock({ block }: { block: BlogBlock }) {
  if (!block.text) return null;

  return (
    <blockquote className="my-[var(--space-component)] px-[var(--space-section)] py-[var(--space-component)] border-l-2 border-[var(--color-ink-tertiary)]">
      <p className="font-[family-name:var(--font-display)] text-[length:var(--text-lead)] text-[var(--color-ink)] leading-relaxed italic">
        {block.text}
      </p>
    </blockquote>
  );
}

// ─── Text Block ──────────────────────────────────────────────────────────────
// Story/narrative text with beautiful typography.

function TextBlock({ block }: { block: BlogBlock }) {
  if (!block.text) return null;

  return (
    <div className="text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.75] whitespace-pre-line">
      {block.text}
    </div>
  );
}

// ─── Legacy Photo Layout ─────────────────────────────────────────────────────
// Backward-compatible layout for when blocks aren't available.
// Still improved: uses natural aspect ratios instead of object-cover.

function LegacyPhotoLayout({ photos }: { photos: BlogPhoto[] }) {
  const groups: BlogPhoto[][] = [];
  let i = 0;

  while (i < photos.length) {
    const current = photos[i];
    const isLandscape = current.width > current.height;

    if (isLandscape || i === photos.length - 1) {
      groups.push([current]);
      i += 1;
    } else {
      const next = photos[i + 1];
      if (next && next.height >= next.width) {
        groups.push([current, next]);
        i += 2;
      } else {
        groups.push([current]);
        i += 1;
      }
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-section)]">
      {groups.map((group, gi) => (
        <div
          key={gi}
          className={`grid gap-[var(--space-element)] items-center ${
            group.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {group.map((photo) => (
            <figure key={photo.id}>
              <img
                src={photo.developed_url || photo.thumbnail_url}
                alt={photo.caption || ''}
                className="w-full rounded-[var(--radius-sharp)]"
                style={{
                  aspectRatio:
                    photo.width && photo.height
                      ? `${photo.width}/${photo.height}`
                      : undefined,
                }}
                loading="lazy"
              />
              {photo.caption && (
                <figcaption className="mt-[var(--space-tight)] text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] italic">
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
