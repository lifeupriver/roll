'use client';

interface GalleryHeaderProps {
  businessName: string | null;
  logoUrl: string | null;
  accentColor?: string;
}

export function GalleryHeader({ businessName, logoUrl, accentColor }: GalleryHeaderProps) {
  return (
    <header
      className="border-b px-4 py-3 flex items-center gap-3"
      style={{ borderColor: accentColor || '#e5e5e5' }}
    >
      {logoUrl && (
        <img src={logoUrl} alt={businessName || ''} className="w-8 h-8 rounded-full object-cover" />
      )}
      <span className="font-semibold text-sm" style={{ color: accentColor || '#1a1a1a' }}>
        {businessName || 'Gallery'}
      </span>
      <span className="ml-auto text-xs text-[#999]">Powered by Roll</span>
    </header>
  );
}
