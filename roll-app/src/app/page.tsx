import { EmailCaptureForm } from '@/components/landing/EmailCaptureForm';
import { FilmProfileShowcase } from '@/components/landing/FilmProfileShowcase';
import { HeroVisual } from '@/components/landing/HeroVisual';
import { FeedVisual, RollVisual, DevelopVisual, PrintsVisual } from '@/components/landing/FeatureVisuals';
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
  { title: 'Circle', desc: 'Share your best photos with family and friends in a private feed. No ads, no algorithm.' },
  { title: 'Books', desc: 'Turn your favorites into a hardcover photo book. Flip through pages in the app, then order a printed copy.' },
  { title: 'Video', desc: 'Roll corrects your videos with the same film stock as your photos. Same beautiful look. No editing required.' },
  { title: 'Stories & Captions', desc: 'Write the story behind a roll. Caption individual photos. Turn images into a narrative.' },
  { title: 'Photo Map', desc: 'See where your photos were taken on a world map. Your life, geographically.' },
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
              href="/feed"
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
          Section 2: The Problem
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-section)]">
            <span className="font-[family-name:var(--font-mono)]">20,000</span> photos on your phone.
            <br />
            Zero on your wall.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[55ch] mx-auto">
            You take hundreds of photos every month. Screenshots, duplicates,
            blurry shots — they pile up alongside the ones that actually matter.
            The good ones get buried. Nothing gets printed. Nothing gets shared.
          </p>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-tertiary)] leading-[1.6] max-w-[55ch] mx-auto mt-[var(--space-component)]">
            In 40 years, your grandkids will scroll through thousands of unnamed images
            and have no idea who these people were or why the moment mattered.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 3: How It Works
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-region)]">
            How Roll works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-[var(--space-section)]">
            {[
              { step: '1', title: 'Upload', body: 'Drop in your camera roll. Roll automatically filters out the noise — screenshots, duplicates, blurry shots.' },
              { step: '2', title: 'Curate', body: 'Browse your feed. Checkmark your favorites. Fill a roll of 36 photos — like loading a real roll of film.' },
              { step: '3', title: 'Develop', body: 'Choose a film stock. Hit develop. We color-correct every photo to match the look of real analog film.' },
              { step: '4', title: 'Keep', body: 'Order prints, create photo books, share to your Circle, or write the story behind each roll.' },
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </span>
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-component)] mt-[var(--space-section)]">
              {SECONDARY_FEATURES.map(({ title, desc }) => (
                <div key={title} className="flex flex-col gap-[var(--space-micro)] p-[var(--space-component)] rounded-[var(--radius-card)] bg-[var(--color-surface-raised)]">
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
          Section 5: Film Profiles
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-element)]">
            Six film stocks. Each one beautiful.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center max-w-[50ch] mx-auto mb-[var(--space-section)]">
            Every film stock is inspired by real analog film. Warmth for golden hour. Classic for timeless black and white. Your photos, with the character of real film.
          </p>
          <FilmProfileShowcase />
        </div>
      </section>

      {/* ================================================
          Section 6: What You Can Create
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-region)]">
            From screen to something real
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-section)]">
            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect width="12" height="8" x="6" y="14"></rect></svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Prints
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                High-quality 4&times;6 prints delivered to your door. Your first roll is free.
              </p>
            </div>

            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Books
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Turn your favorites into an 8&times;8 hardcover photo book. Flip through it in the app or order a printed copy.
              </p>
            </div>

            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-action-subtle)] flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Circle
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Share your best photos with family and friends in a private feed. No ads. No algorithm. Just the people you love.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 7: Interactive Demo CTA
          ================================================ */}
      <section className="w-full bg-[var(--color-surface-overlay)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto px-[var(--space-component)] md:px-[var(--space-section)] text-center flex flex-col items-center gap-[var(--space-section)]">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink-inverse)]">
            See it in action
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-inverse)] opacity-80 leading-[1.6] max-w-[45ch]">
            Explore the full app with sample photos. Browse the feed, develop a roll, create a book, share to a circle — everything works.
          </p>
          <Link
            href="/feed"
            className="inline-flex items-center justify-center h-14 px-[var(--space-region)] bg-[var(--color-action)] text-white rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] shadow-[var(--shadow-floating)]"
          >
            Try the Interactive Demo
          </Link>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-inverse)] opacity-50">
            No account needed. Explore with sample data.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 8: Pricing
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-section)]">
            Free to start. $4.99/month for everything.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-section)]">
            {/* Free tier */}
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-section)]">
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-component)]">
                Free
              </h3>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li>Upload and auto-filter unlimited photos</li>
                <li>Develop your first roll with Warmth</li>
                <li>First <span className="font-[family-name:var(--font-mono)]">36</span> prints free</li>
                <li>Heart favorites and add captions</li>
                <li>1 private Circle for sharing</li>
                <li>Photo map and search</li>
              </ul>
            </div>

            {/* Roll+ tier */}
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-[var(--space-section)] shadow-[var(--shadow-raised)]">
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-component)]">
                Roll+ <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-action)]">$4.99/mo</span>
              </h3>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li>All 6 film stocks</li>
                <li>Unlimited rolls and cloud processing</li>
                <li>Unlimited Circles</li>
                <li>Photo Books from your favorites</li>
                <li>Stories and captions on rolls</li>
                <li>Cloud backup for all your photos</li>
                <li>Darkroom mode</li>
              </ul>
            </div>
          </div>

          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] text-center mt-[var(--space-section)]">
            No ads. No tracking. No training on your photos. Your data is encrypted and never sold.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 8.5: Privacy Promise
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-section)]">
            Your photos are private by default.
          </h2>
          <ul className="flex flex-col gap-[var(--space-element)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[45ch] mx-auto text-left">
            <li className="flex items-start gap-[var(--space-element)]">
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              Encrypted in transit and at rest (AES-256)
            </li>
            <li className="flex items-start gap-[var(--space-element)]">
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              No ads. No tracking pixels. No data brokers.
            </li>
            <li className="flex items-start gap-[var(--space-element)]">
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              Your photos are never used to train models
            </li>
            <li className="flex items-start gap-[var(--space-element)]">
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              EXIF location data is never shared with other users
            </li>
            <li className="flex items-start gap-[var(--space-element)]">
              <span className="shrink-0 mt-1 w-5 h-5 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              Delete your account and everything is gone — permanently
            </li>
          </ul>
        </div>
      </section>

      {/* ================================================
          Section 9: Final CTA — Email Capture
          ================================================ */}
      <section id="signup" className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[800px] mx-auto flex flex-col items-center text-center gap-[var(--space-section)]">
          <h2
            className="font-[family-name:var(--font-display)] font-medium text-[var(--color-ink)]"
            style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Develop your roll.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[40ch]">
            Upload your photos. Pick your 36 favorites.
            We develop them and ship your prints — on us.
          </p>
          <EmailCaptureForm
            id="hero-email"
            trustLine="No ads. No algorithm. No training on your photos. No selling your data. Your photos stay yours."
          />
        </div>
      </section>

      {/* ================================================
          Section 10: Footer
          ================================================ */}
      <footer className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-section)] border-t border-[var(--color-border)]">
        <div className="max-w-[800px] mx-auto flex flex-col items-center gap-[var(--space-element)] text-center">
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
            Roll — Made with love for the photos that matter.
          </p>
          <nav className="flex gap-[var(--space-component)]" aria-label="Footer links">
            <a href="/privacy" className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline">
              Privacy
            </a>
            <a href="/terms" className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline">
              Terms
            </a>
            <a href="mailto:hello@roll.photos" className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-secondary)] hover:underline">
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
