import { EmailCaptureForm } from '@/components/landing/EmailCaptureForm';
import { FilmProfileShowcase } from '@/components/landing/FilmProfileShowcase';

export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center">
      {/* ================================================
          Section 1: Hero — "Recognition"
          ================================================ */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-hero)]">
        <div className="flex flex-col items-center gap-[var(--space-section)] max-w-[800px] w-full text-center">
          {/* Logotype */}
          <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-logotype)] tracking-[0.15em] text-[var(--color-ink)]">
            ROLL
          </h1>

          {/* Tagline */}
          <p
            className="font-[family-name:var(--font-display)] font-light italic text-[var(--color-ink)] leading-[1.3] max-w-[28ch]"
            style={{ fontSize: 'clamp(1.25rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Your phone captures everything.
            <br />
            Roll turns it into something worth keeping.
          </p>

          {/* Email capture */}
          <div className="flex flex-col items-center mt-[var(--space-component)]">
            <EmailCaptureForm
              id="hero-email"
              trustLine="Free to try. No credit card."
            />
          </div>
        </div>
      </section>

      {/* ================================================
          Section 2: The Problem — "Recognition"
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-section)]">
            <span className="font-[family-name:var(--font-mono)]">20,000</span> photos on your phone.
            <br />
            Zero on your wall.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[55ch] mx-auto md:mx-0">
            You take hundreds of photos every month. Screenshots, duplicates,
            blurry shots — they pile up alongside the photos that actually matter.
            The good ones get buried. Nothing gets printed.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 3: How It Works — "Curiosity"
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-region)]">
            {/* Step 1 */}
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)]">
              <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-display)] text-[var(--color-action)] tracking-[0.05em]">
                1
              </span>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mt-[var(--space-element)] mb-[var(--space-tight)]">
                Upload your photos
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Drop in your camera roll. Roll removes the screenshots,
                duplicates, and blurry shots automatically.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)]">
              <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-display)] text-[var(--color-action)] tracking-[0.05em]">
                2
              </span>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mt-[var(--space-element)] mb-[var(--space-tight)]">
                Pick your favorites
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Checkmark your best <span className="font-[family-name:var(--font-mono)]">36</span> photos to fill a roll.
                Choose a film stock. We develop them.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-component)] shadow-[var(--shadow-raised)]">
              <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-display)] text-[var(--color-action)] tracking-[0.05em]">
                3
              </span>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mt-[var(--space-element)] mb-[var(--space-tight)]">
                Get real prints
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Your first roll of prints is free. Delivered to your door
                in 3–5 days. Photos that look like they were shot on film.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 4: Film Profiles Showcase — "Desire"
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-section)]">
            Six film stocks. Each one beautiful.
          </h2>
          <FilmProfileShowcase />
        </div>
      </section>

      {/* ================================================
          Section 5: Free First Roll — "Trust"
          ================================================ */}
      <section className="w-full bg-[var(--color-surface-raised)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto px-[var(--space-component)] md:px-[var(--space-section)] text-center">
          <h2 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-section)]">
            Your first roll is free.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink)] leading-[1.6] max-w-[40ch] mx-auto mb-[var(--space-region)]">
            Upload your photos. Pick your <span className="font-[family-name:var(--font-mono)]">36</span> favorites.
            We develop them and print them — on us.
            No credit card. No catch. Real 4×6 prints
            delivered to your door.
          </p>
          <a
            href="#hero-email"
            className="inline-flex items-center justify-center h-12 px-[var(--space-section)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98]"
          >
            Get your free prints
          </a>
        </div>
      </section>

      {/* ================================================
          Section 6: Circle — Brief Mention
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto text-center">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
            Share with the people who matter.
          </h2>
          <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[55ch] mx-auto">
            Circle is your private photo feed. No ads. No algorithm.
            Just the best photos from the people you love.
          </p>
          {/* Simple visual — stacked photo cards */}
          <div className="flex justify-center mt-[var(--space-section)]">
            <div className="flex flex-col gap-[var(--space-element)] w-full max-w-[320px]">
              {['Sarah', 'Marcus', 'You'].map((name, i) => (
                <div
                  key={name}
                  className="flex items-center gap-[var(--space-element)] bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-element)] shadow-[var(--shadow-raised)]"
                >
                  <div className="w-10 h-10 rounded-[var(--radius-pill)] bg-[var(--color-surface-sunken)] flex items-center justify-center flex-shrink-0">
                    <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">
                      {name[0]}
                    </span>
                  </div>
                  <div className="flex gap-[var(--space-micro)] flex-1 overflow-hidden">
                    {[0, 1, 2].map((j) => (
                      <div
                        key={j}
                        className="w-12 h-12 rounded-[var(--radius-sharp)] bg-[var(--color-surface-sunken)] flex-shrink-0"
                        style={{ opacity: 1 - i * 0.1 - j * 0.05 }}
                      />
                    ))}
                  </div>
                  <span className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] whitespace-nowrap">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 7: Pricing — Simple
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
                <li>Upload and filter unlimited photos</li>
                <li>Develop your first roll with Warmth</li>
                <li>First <span className="font-[family-name:var(--font-mono)]">36</span> prints free</li>
              </ul>
            </div>

            {/* Roll+ tier */}
            <div className="rounded-[var(--radius-card)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-[var(--space-section)] shadow-[var(--shadow-raised)]">
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] mb-[var(--space-component)]">
                Roll+
              </h3>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li>All 6 film stocks</li>
                <li>Unlimited cloud processing</li>
                <li>Create and manage Circles</li>
                <li>Album printing from Favorites</li>
                <li>Cloud backup for all your photos</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center mt-[var(--space-section)]">
            <a
              href="#hero-email"
              className="inline-flex items-center justify-center h-12 px-[var(--space-section)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-label)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98]"
            >
              Start free
            </a>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 8: Footer CTA — Final Email Capture
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[800px] mx-auto flex flex-col items-center text-center gap-[var(--space-section)]">
          <h2
            className="font-[family-name:var(--font-display)] font-medium text-[var(--color-ink)]"
            style={{ fontSize: 'clamp(1.5rem, 3vw + 0.5rem, 1.875rem)' }}
          >
            Develop your roll.
          </h2>
          <EmailCaptureForm
            trustLine="No ads. No algorithm. No selling your data. Just your photos, made beautiful."
          />
        </div>
      </section>

      {/* ================================================
          Section 9: Footer
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
