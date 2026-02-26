import { EmailCaptureForm } from '@/components/landing/EmailCaptureForm';
import { FilmProfileShowcase } from '@/components/landing/FilmProfileShowcase';
import { AnimatedCounter } from '@/components/landing/AnimatedCounter';
import { HeroVisual } from '@/components/landing/HeroVisual';
import {
  FeedVisual,
  RollVisual,
  DevelopVisual,
  PrintsVisual,
} from '@/components/landing/FeatureVisuals';
import { MagazineDemo } from '@/components/landing/MagazineDemo';
import { BookDemo } from '@/components/landing/BookDemo';
import Link from 'next/link';

export const dynamic = 'force-static';

const PRIMARY_FEATURES = [
  {
    title: 'AI-Filtered Feed',
    subtitle: 'Your best photos, surfaced automatically',
    desc: 'Roll filters out screenshots, duplicates, and blurry shots — so you only see the photos that matter. Smart content modes let you browse by people, places, or moments.',
    Visual: FeedVisual,
  },
  {
    title: 'Roll Building',
    subtitle: 'Pick your 36 favorites, like loading a roll of film',
    desc: 'Browse your feed and checkmark the shots you love. Fill a roll of 36 photos — like loading a real roll of film. The film strip fills frame by frame until it clicks.',
    Visual: RollVisual,
  },
  {
    title: 'Film Profiles',
    subtitle: 'Six film stocks that make your photos beautiful',
    desc: 'Choose a film stock. Hit develop. Every photo is color-corrected, then processed through a film profile inspired by real analog film. Warmth, Golden, Vivid, Classic, Gentle, Modern.',
    Visual: DevelopVisual,
  },
  {
    title: 'Prints Delivered',
    subtitle: 'Real prints, mailed to your door',
    desc: 'High-quality 4×6 prints of your developed roll, shipped to your door. Your first roll of prints is free. No subscription required.',
    Visual: PrintsVisual,
  },
];

const SECONDARY_FEATURES = [
  {
    title: 'Circle',
    desc: 'Share your best photos with family and friends in a private feed. No ads, no algorithm.',
  },
  {
    title: 'Magazines',
    desc: 'Auto-designed from your favorites — monthly, quarterly, or annual. Choose a template and we lay out every page.',
  },
  {
    title: 'Video',
    desc: 'Roll corrects your videos with the same film stock as your photos. Same beautiful look. No editing required.',
  },
  {
    title: 'Stories & Captions',
    desc: 'Write the story behind a roll. Caption individual photos. Turn images into a narrative.',
  },
  {
    title: 'Photo Map',
    desc: 'See where your photos were taken on a world map. Your life, geographically.',
  },
  { title: 'Backup', desc: 'Every photo you upload is backed up in the cloud. Encrypted. Safe.' },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center">
      {/* ================================================
          Section 1: Hero — Split layout with visual
          ================================================ */}
      <section className="flex flex-col items-center justify-center min-h-[90vh] w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-hero)]">
        <div className="flex flex-col items-center gap-[var(--space-region)] max-w-[900px] w-full">
          {/* Logotype */}
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)] text-center">
            ROLL
          </h1>

          {/* Tagline */}
          <p
            className="font-[family-name:var(--font-display)] font-light italic text-[var(--color-ink)] leading-[1.3] max-w-[32ch] text-center"
            style={{ fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Your phone captures thousands of photos.
            <br />
            Roll turns them into something worth keeping.
          </p>

          {/* Hero Visual — camera roll transformation mockup */}
          <HeroVisual />

          {/* CTA buttons — primary: Get Started Free, secondary: See a Demo */}
          <div className="flex flex-col sm:flex-row items-center gap-[var(--space-element)] mt-[var(--space-component)]">
            <a
              href="#signup"
              className="inline-flex items-center justify-center h-14 px-8 py-4 bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] shadow-[var(--shadow-floating)]"
            >
              Get Started Free
            </a>
            <Link
              href="/photos"
              className="inline-flex items-center justify-center h-14 px-6 text-[var(--color-action)] font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:underline"
            >
              See a Demo
            </Link>
          </div>

          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)] font-light text-center">
            No credit card required. Your first roll of prints is free.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 2: Problem Statement
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-center gap-[var(--space-region)]">
          {/* Lifestyle image placeholder */}
          <div className="w-full md:w-1/2 aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center">
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
              Lifestyle image
            </span>
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-component)]">
              <AnimatedCounter
                from={30000}
                to={36}
                duration={2800}
                className="font-[family-name:var(--font-mono)]"
              />{' '}
              photos on your phone.
              <br />
              Zero on your wall.
            </h2>
            <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[45ch]">
              The good ones are buried under screenshots, duplicates, and blurry shots. Nothing gets
              printed. Nothing gets shared.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 3: Social Proof — Testimonial
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20">
        <div className="max-w-[600px] mx-auto">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-floating)] p-[var(--space-region)] text-center">
            <svg
              className="mx-auto mb-[var(--space-component)] text-[var(--color-action)]"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M11.3 2.3c-.4-.2-.8-.3-1.3-.3C7.2 2 5 4.7 5 8c0 2 .7 3.7 2 5v6c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3v-6c0-1.7-1.3-3-3-3H9.3C9.1 8.7 9 7.4 9 6c0-1.1.3-2.1.8-2.8l1.5.1zm10 0c-.4-.2-.8-.3-1.3-.3-2.8 0-5 2.7-5 6 0 2 .7 3.7 2 5v6c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3v-6c0-1.7-1.3-3-3-3h-2.7c-.2-1.3-.3-2.6-.3-4 0-1.1.3-2.1.8-2.8l1.5.1z" />
            </svg>
            <blockquote className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] leading-[1.5] mb-[var(--space-component)]">
              I finally printed photos of my kids. They&apos;re on the fridge now, not buried in my
              phone.
            </blockquote>
            <div className="flex items-center justify-center gap-[var(--space-element)]">
              {/* Optional avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
                <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-ink-tertiary)]">
                  S
                </span>
              </div>
              <div className="text-left">
                <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-ink)]">
                  Sarah M.
                </p>
                <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                  Mom of two, Austin TX
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 3b: How Roll Works — 4-step overview
          ================================================ */}
      <section className="w-full py-20 bg-[var(--color-surface-raised)]">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-region)] px-[var(--space-component)]">
            How Roll works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--space-section)]">
            {[
              {
                step: '1',
                title: 'Upload',
                body: 'Drop in your camera roll. Roll automatically filters out the noise — screenshots, duplicates, blurry shots.',
              },
              {
                step: '2',
                title: 'Curate',
                body: 'Browse your feed. Checkmark your favorites. Fill a roll of 36 photos — like loading a real roll of film.',
              },
              {
                step: '3',
                title: 'Develop',
                body: 'Choose a film stock. Hit develop. We color-correct every photo to match the look of real analog film.',
              },
              {
                step: '4',
                title: 'Keep',
                body: 'Order prints, create photo books, share to your Circle, or write the story behind each roll.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-[var(--space-tight)]">
                <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-display)] text-[var(--color-action)] tracking-[0.05em]">
                  {step}
                </span>
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          Section 4: Primary Features (4 cards with hierarchy)
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-element)]">
            Everything you need for the photos that matter
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center max-w-[50ch] mx-auto mb-[var(--space-region)]">
            From messy camera roll to beautiful prints — four steps, one app.
          </p>

          {/* Top 2 features: full-width hero-sized cards */}
          <div className="flex flex-col gap-[var(--space-section)]">
            {PRIMARY_FEATURES.slice(0, 2).map(({ title, subtitle, desc, Visual }) => (
              <div
                key={title}
                className="flex flex-col md:flex-row gap-[var(--space-section)] items-center rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] p-[var(--space-section)] shadow-[var(--shadow-raised)]"
              >
                <div className="w-full md:w-1/2">
                  <Visual />
                </div>
                <div className="w-full md:w-1/2 flex flex-col gap-[var(--space-tight)]">
                  <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                    {title}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-action)]">
                    {subtitle}
                  </p>
                  <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                    {desc}
                  </p>
                </div>
              </div>
            ))}

            {/* Bottom 2 features: 2-column row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-section)]">
              {PRIMARY_FEATURES.slice(2).map(({ title, subtitle, desc, Visual }) => (
                <div
                  key={title}
                  className="flex flex-col gap-[var(--space-tight)] rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] p-[var(--space-section)] shadow-[var(--shadow-raised)]"
                >
                  <Visual />
                  <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mt-[var(--space-tight)]">
                    {title}
                  </h3>
                  <p className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-action)]">
                    {subtitle}
                  </p>
                  <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* "And more..." collapsed section */}
          <details className="mt-[var(--space-region)]">
            <summary className="cursor-pointer font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] text-center list-none">
              <span className="inline-flex items-center gap-[var(--space-tight)] hover:text-[var(--color-action)] transition-colors">
                And more...
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-component)] mt-[var(--space-section)]">
              {SECONDARY_FEATURES.map(({ title, desc }) => (
                <div
                  key={title}
                  className="flex flex-col gap-[var(--space-micro)] p-[var(--space-component)] rounded-[var(--radius-card)] bg-[var(--color-surface-raised)]"
                >
                  <h4 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-body)] text-[var(--color-ink)]">
                    {title}
                  </h4>
                  <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] leading-[1.5]">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </details>
        </div>
      </section>

      {/* ================================================
          Section 5: Film Profiles — Full-Width Showcase
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-element)]">
            Six film stocks. Each one beautiful.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center max-w-[50ch] mx-auto mb-[var(--space-section)]">
            Every film stock is inspired by real analog film. Click a profile to see the difference.
          </p>
          <FilmProfileShowcase />
        </div>
      </section>

      {/* ================================================
          Section 6: The Result — Physical prints
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20 bg-[var(--color-surface-raised)]">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-element)]">
            From screen to something real
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center max-w-[50ch] mx-auto mb-[var(--space-region)]">
            Click to explore each product — see exactly what you get.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-section)]">
            {/* Prints card */}
            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-full aspect-[3/4] rounded-[var(--radius-card)] overflow-hidden shadow-[var(--shadow-card)] relative group">
                <img
                  src="/photos/IMG_3518 Large.jpeg"
                  alt="Prints preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-4">
                  <p className="font-[family-name:var(--font-display)] font-semibold text-white text-[length:var(--text-lead)] leading-tight">
                    Prints
                  </p>
                  <p className="text-white/60 text-[length:var(--text-caption)] mt-1 font-[family-name:var(--font-mono)]">
                    4×6 · Matte or Glossy
                  </p>
                </div>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Prints
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                High-quality 4&times;6 prints delivered to your door. Your first roll is free.
              </p>
            </div>

            {/* Magazine demo (interactive) */}
            <MagazineDemo />

            {/* Book demo (interactive) */}
            <BookDemo />
          </div>
        </div>
      </section>

      {/* ================================================
          Section 7: Privacy — Elevated with warm treatment
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20">
        <div className="max-w-[700px] mx-auto">
          <div className="rounded-[var(--radius-modal)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-floating)] p-[var(--space-region)] md:p-[var(--space-page)]">
            <div className="flex items-center justify-center mb-[var(--space-section)]">
              <div className="w-14 h-14 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
            </div>
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-component)]">
              Your photos are private. Period.
            </h2>
            <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6] text-center mb-[var(--space-section)] max-w-[45ch] mx-auto">
              We built Roll for families who want to keep their photos safe — not feed an algorithm.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[var(--space-element)]">
              {[
                'Encrypted in transit and at rest (AES-256)',
                'No ads. No tracking pixels. No data brokers.',
                'Your photos are never used to train models',
                'Delete your account and everything is gone',
              ].map((item) => (
                <div key={item} className="flex items-start gap-[var(--space-tight)]">
                  <span className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] leading-[1.5]">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 8: Pricing — Outcome-focused
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20 bg-[var(--color-surface-raised)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-section)]">
            Free to start. $4.99/month for everything.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-section)]">
            {/* Free tier */}
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-section)]">
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-tight)]">
                Free
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] mb-[var(--space-component)] leading-[1.5]">
                Upload your photos. Develop your first roll. Get your first 36 prints free.
              </p>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-developed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  1 film stock (Warmth)
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-developed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  First 36 prints free
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-developed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  1 private Circle
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-developed)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Photo map and search
                </li>
              </ul>
            </div>

            {/* Roll+ tier */}
            <div className="rounded-[var(--radius-card)] border-2 border-[var(--color-action)] bg-[var(--color-surface)] p-[var(--space-section)] shadow-[var(--shadow-floating)]">
              <div className="flex items-baseline gap-[var(--space-tight)] mb-[var(--space-tight)]">
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                  Roll+
                </h3>
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-action)]">
                  $4.99/mo
                </span>
              </div>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] mb-[var(--space-component)] leading-[1.5]">
                Unlimited rolls developed monthly. Prints delivered to your door. Your best photos —
                always backed up.
              </p>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-action)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All 6 film stocks
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-action)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Unlimited rolls and cloud backup
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-action)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Photo Books from your favorites
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--color-action)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Unlimited Circles
                </li>
              </ul>
            </div>
          </div>

          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center mt-[var(--space-section)]">
            No ads. No tracking. No training on your photos.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 9: Final CTA — Single button
          ================================================ */}
      <section
        id="signup"
        className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-20"
      >
        <div className="max-w-[500px] mx-auto flex flex-col items-center text-center gap-[var(--space-section)]">
          <h2
            className="font-[family-name:var(--font-display)] font-medium text-[var(--color-ink)]"
            style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Develop your roll.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[40ch]">
            Upload your photos. Pick your 36 favorites. We develop them and ship your prints — on
            us.
          </p>
          <EmailCaptureForm
            id="hero-email"
            trustLine="No ads. No algorithm. No training on your photos."
          />
        </div>
      </section>

      {/* ================================================
          Footer
          ================================================ */}
      <footer className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-section)] border-t border-[var(--color-border)]">
        <div className="max-w-[800px] mx-auto flex flex-col items-center gap-[var(--space-element)] text-center">
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Roll — Made with love for the photos that matter.
          </p>
          <nav className="flex gap-[var(--space-component)]" aria-label="Footer links">
            <a
              href="/privacy"
              className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline"
            >
              Privacy
            </a>
            <a
              href="/terms"
              className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline"
            >
              Terms
            </a>
            <a
              href="mailto:hello@roll.photos"
              className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline"
            >
              Contact
            </a>
          </nav>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            &copy; 2026 Roll
          </p>
        </div>
      </footer>
    </main>
  );
}
