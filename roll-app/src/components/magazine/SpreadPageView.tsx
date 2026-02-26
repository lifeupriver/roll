'use client';

export type DemoLayout = 'full_bleed' | 'two_up_vertical' | 'two_up_horizontal' | 'four_up_grid' | 'three_up_top_heavy' | 'caption_heavy';

export interface DemoPage {
  layout: DemoLayout | 'section_divider' | 'cover';
  photos: string[];
  caption?: string;
  title?: string;
}

export function getGridStyles(layout: string): React.CSSProperties {
  switch (layout) {
    case 'full_bleed':
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr' };
    case 'two_up_vertical':
      return { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr' };
    case 'two_up_horizontal':
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr 1fr' };
    case 'three_up_top_heavy':
      return { gridTemplateRows: '2fr 1fr', gridTemplateColumns: '1fr 1fr' };
    case 'four_up_grid':
      return { gridTemplateRows: '1fr 1fr', gridTemplateColumns: '1fr 1fr' };
    default:
      return { gridTemplateRows: '1fr', gridTemplateColumns: '1fr' };
  }
}

export function SpreadPageView({ page, pageIndex, font }: { page: DemoPage | null; pageIndex: number; font: string }) {
  if (!page) {
    return <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] flex items-center justify-center" />;
  }

  if (page.layout === 'cover') {
    return (
      <div className="relative flex-1 aspect-[3/4] overflow-hidden">
        <img src={page.photos[0]} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-4 md:p-6">
          <h3 className="text-white font-medium text-[clamp(1rem,2.5vw,1.5rem)] leading-tight drop-shadow-md" style={{ fontFamily: font }}>
            {page.title}
          </h3>
          <p className="text-white/60 text-[length:var(--text-caption)] mt-1">{page.caption}</p>
        </div>
        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-sm rounded-[var(--radius-pill)] px-3 py-1">
          <span className="font-[family-name:var(--font-display)] text-white text-[10px] font-bold tracking-[0.1em] uppercase">Roll Magazine</span>
        </div>
      </div>
    );
  }

  if (page.layout === 'section_divider') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-raised)] flex flex-col items-center justify-center gap-2">
        <span className="text-[clamp(0.875rem,2vw,1.25rem)] text-[var(--color-ink)] font-medium" style={{ fontFamily: font }}>{page.title}</span>
        {page.caption && <span className="text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] max-w-[80%] text-center">{page.caption}</span>}
        <div className="w-8 h-px bg-[var(--color-border-strong)] mt-1" />
      </div>
    );
  }

  if (page.layout === 'caption_heavy') {
    return (
      <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden flex flex-col">
        <div className="flex-[2] overflow-hidden">
          <img src={page.photos[0]} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 p-3 bg-[var(--color-surface)] flex items-center">
          <p className="text-[clamp(0.6rem,1.2vw,0.75rem)] text-[var(--color-ink-secondary)] leading-relaxed italic" style={{ fontFamily: font }}>{page.caption}</p>
        </div>
        <span className="absolute bottom-1.5 right-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ink-tertiary)]">{pageIndex + 1}</span>
      </div>
    );
  }

  const gridStyles = getGridStyles(page.layout);

  return (
    <div className="relative flex-1 aspect-[3/4] bg-[var(--color-surface-sunken)] overflow-hidden">
      <div className="w-full h-full grid gap-0.5" style={gridStyles}>
        {page.photos.map((url, i) => (
          <div key={i} className="overflow-hidden">
            <img src={url} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 font-[family-name:var(--font-mono)] text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-[var(--radius-pill)]">
        {pageIndex + 1}
      </span>
      {page.caption && (
        <div className="absolute bottom-6 inset-x-0 px-2">
          <p className="text-white text-[10px] text-center drop-shadow-sm line-clamp-1">{page.caption}</p>
        </div>
      )}
    </div>
  );
}
