'use client';

const PROFILES = [
  { name: 'Warmth', color: 'var(--color-stock-warmth)', filter: 'preview-warmth' },
  { name: 'Golden', color: 'var(--color-stock-golden)', filter: 'preview-golden' },
  { name: 'Vivid', color: 'var(--color-stock-vivid)', filter: 'preview-vivid' },
  { name: 'Classic', color: 'var(--color-stock-classic)', filter: 'preview-classic' },
  { name: 'Gentle', color: 'var(--color-stock-gentle)', filter: 'preview-gentle' },
  { name: 'Modern', color: 'var(--color-stock-modern)', filter: 'preview-modern' },
];

export function FilmProfileShowcase() {
  return (
    <div
      className="flex gap-[var(--space-element)] overflow-x-auto pb-[var(--space-element)] -mx-[var(--space-component)] px-[var(--space-component)] md:-mx-[var(--space-section)] md:px-[var(--space-section)]"
      style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
    >
      {PROFILES.map((profile) => (
        <div
          key={profile.name}
          className="flex-shrink-0 w-[160px] md:w-[200px] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-raised)] shadow-[var(--shadow-raised)]"
          style={{ scrollSnapAlign: 'start' }}
        >
          <div className={`w-full aspect-[4/3] bg-[var(--color-surface-sunken)] ${profile.filter}`}>
            {/* Placeholder for sample photo — processed through each profile */}
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-16 h-16 rounded-[var(--radius-card)] bg-[var(--color-surface)] opacity-30" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-[var(--space-tight)] py-[var(--space-element)]">
            <span
              className="w-[6px] h-[6px] rounded-[var(--radius-pill)] flex-shrink-0"
              style={{ backgroundColor: profile.color }}
            />
            <span className="font-[family-name:var(--font-display)] text-[length:var(--text-label)] text-[var(--color-ink)]">
              {profile.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
