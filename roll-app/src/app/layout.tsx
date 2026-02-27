import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Plus_Jakarta_Sans, Space_Mono } from 'next/font/google';
import { ToastContainer } from '@/components/ui/Toast';
import { AnalyticsProvider } from '@/components/providers/AnalyticsProvider';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-spacemono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
};

export const metadata: Metadata = {
  title: 'Roll — Develop your roll.',
  description:
    'Upload your photos. Pick your favorites. Get real prints delivered to your door. Roll removes the junk, applies beautiful film profiles, and turns your camera roll into something worth keeping.',
  keywords: [
    'photo prints',
    'film photography',
    'photo curation',
    'photo printing',
    'film profiles',
  ],
  openGraph: {
    title: 'Roll — Develop your roll.',
    description: 'Your phone captures everything. Roll turns it into something worth keeping.',
    url: 'https://roll.photos',
    siteName: 'Roll',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Roll — Develop your roll.',
    description: 'Your phone captures everything. Roll turns it into something worth keeping.',
  },
  metadataBase: new URL('https://roll.photos'),
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable} ${spaceMono.variable}`}>
      <head>
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A1612" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Roll" />
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
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
        <AnalyticsProvider>{children}</AnalyticsProvider>
        <ToastContainer />
      </body>
    </html>
  );
}
