'use client';

interface BlogPhoto {
  id: string;
  thumbnail_url: string;
  developed_url: string;
  width: number;
  height: number;
  caption: string | null;
}

interface BlogPhotoLayoutProps {
  photos: BlogPhoto[];
}

export function BlogPhotoLayout({ photos }: BlogPhotoLayoutProps) {
  if (photos.length === 0) return null;

  // Intelligent layout: alternate between full-width and pairs
  const groups: BlogPhoto[][] = [];
  let i = 0;

  while (i < photos.length) {
    const current = photos[i];
    const isLandscape = current.width > current.height;

    if (isLandscape || i === photos.length - 1) {
      // Full-width for landscape or last remaining photo
      groups.push([current]);
      i += 1;
    } else {
      // Try to pair portraits
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
    <div className="flex flex-col gap-[var(--space-component)]">
      {groups.map((group, gi) => (
        <div
          key={gi}
          className={`grid gap-[var(--space-element)] ${
            group.length === 2 ? 'grid-cols-2' : 'grid-cols-1'
          }`}
        >
          {group.map((photo) => (
            <figure key={photo.id} className="overflow-hidden">
              <img
                src={photo.developed_url || photo.thumbnail_url}
                alt={photo.caption || ''}
                className="w-full rounded-[var(--radius-sharp)] object-cover"
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
