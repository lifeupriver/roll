import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roll — Develop Your Photos',
  description: 'Roll rescues your photos from the digital graveyard. Upload, curate, develop with film profiles, and get real prints delivered.',
  keywords: ['photo prints', 'film photography', 'photo curation', 'photo printing'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts — loaded via CDN link tags as fallback when next/font/google is unavailable */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,700;1,300&family=Plus+Jakarta+Sans:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="film-grain min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-[family-name:var(--font-body)] font-light">
        {children}
      </body>
    </html>
  );
}
