import { EmailCaptureForm } from '@/components/landing/EmailCaptureForm';
import { FilmProfileShowcase } from '@/components/landing/FilmProfileShowcase';
import Link from 'next/link';

export const dynamic = 'force-static';

const FEATURES = [
  {
    title: 'Feed',
    desc: 'Your camera roll, cleaned up. Roll filters out screenshots, duplicates, and blurry shots — so you only see the photos that matter.',
  },
  {
    title: 'Rolls',
    desc: 'Pick your best 36 photos to fill a roll. Choose a film stock. Hit develop. AI color-corrects every shot to match real film.',
  },
  {
    title: 'Develop',
    desc: 'Six film stocks inspired by real analog film. Warmth, Golden, Vivid, Classic, Gentle, Modern — each one transforms your photos.',
  },
  {
    title: 'Favorites',
    desc: 'Heart the shots you love. Your favorites become the source for prints, books, and shares — the photos you actually want to keep.',
  },
  {
    title: 'Books',
    desc: 'Turn your favorites into a hardcover photo book. Flip through pages in the app, then order a printed copy delivered to your door.',
  },
  {
    title: 'Circle',
    desc: 'Share your best photos with family and friends in a private feed. No ads, no algorithm — just the people you choose.',
  },
  {
    title: 'Stories & Captions',
    desc: 'Write the story behind a roll. Caption individual photos. Turn a collection of images into a narrative you can look back on.',
  },
  {
    title: 'Photo Map',
    desc: 'See where your photos were taken on a world map. Every geotagged shot appears as a dot — your life, geographically.',
  },
];

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center">
      {/* ================================================
          Section 1: Hero
          ================================================ */}
      <section className="flex flex-col items-center justify-center min-h-[90vh] w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-hero)]">
        <div className="flex flex-col items-center gap-[var(--space-section)] max-w-[800px] w-full text-center">
          {/* Logotype */}
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)]">
            ROLL
          </h1>

          {/* Tagline */}
          <p
            className="font-[family-name:var(--font-display)] font-light italic text-[var(--color-ink)] leading-[1.3] max-w-[32ch]"
            style={{ fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Your phone captures thousands of photos.
            <br />
            Roll turns them into something worth keeping.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-[var(--space-element)] mt-[var(--space-component)]">
            <Link
              href="/feed"
              className="inline-flex items-center justify-center h-14 px-[var(--space-region)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] shadow-[var(--shadow-floating)]"
            >
              See a Demo
            </Link>
            <a
              href="#signup"
              className="inline-flex items-center justify-center h-14 px-[var(--space-region)] border border-[var(--color-border-strong)] text-[var(--color-ink)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-surface-raised)] active:scale-[0.98]"
            >
              Get Started Free
            </a>
          </div>

          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)] font-light">
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
              { step: '2', title: 'Curate', body: 'Browse your feed. Heart your favorites. Fill a roll of 36 photos — like loading a real roll of film.' },
              { step: '3', title: 'Develop', body: 'Choose a film stock. Hit develop. AI color-corrects every photo to match the look of real analog film.' },
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
          Section 4: Feature Showcase
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-element)]">
            Everything you need for the photos that matter
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] text-center max-w-[50ch] mx-auto mb-[var(--space-region)]">
            Roll is a complete photo platform — from upload to print, from personal curation to sharing with the people you love.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-section)]">
            {FEATURES.map(({ title, desc }) => (
              <div key={title} className="flex flex-col gap-[var(--space-tight)]">
                {/* Screenshot placeholder */}
                <div className="w-full aspect-[16/10] bg-[var(--color-surface-sunken)] rounded-[var(--radius-card)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                  <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
                    {title} screenshot
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                  {title}
                </h3>
                <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
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
                <li>Create and manage Circles</li>
                <li>Photo Books from your favorites</li>
                <li>Stories and captions on rolls</li>
                <li>Cloud backup for all your photos</li>
                <li>Darkroom mode</li>
              </ul>
            </div>
          </div>
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
            trustLine="No ads. No algorithm. No selling your data. Just your photos, made beautiful."
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
