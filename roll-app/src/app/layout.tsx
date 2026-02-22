import type { Metadata } from 'next';
import { ToastContainer } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roll — Develop your roll.',
  description:
    'Upload your photos. Pick your favorites. Get real prints delivered to your door. Roll removes the junk, applies beautiful film profiles, and turns your camera roll into something worth keeping.',
  keywords: ['photo prints', 'film photography', 'photo curation', 'photo printing', 'film profiles'],
  openGraph: {
    title: 'Roll — Develop your roll.',
    description:
      'Your phone captures everything. Roll turns it into something worth keeping.',
    url: 'https://roll.photos',
    siteName: 'Roll',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roll — Develop your roll.',
    description:
      'Your phone captures everything. Roll turns it into something worth keeping.',
  },
  metadataBase: new URL('https://roll.photos'),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,700;1,300&family=Plus+Jakarta+Sans:wght@300;500;600&family=Space+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
        {/* Structured Data JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebApplication',
              name: 'Roll',
              url: 'https://roll.photos',
              description:
                'Upload your photos, pick your favorites, get real prints. Roll removes junk and applies beautiful film profiles.',
              applicationCategory: 'PhotographyApplication',
              operatingSystem: 'Web',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free first roll of prints',
              },
            }),
          }}
        />
      </head>
      <body className="film-grain min-h-screen bg-[var(--color-surface)] text-[var(--color-ink)] font-[family-name:var(--font-body)] font-light">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
