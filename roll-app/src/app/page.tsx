import { EmailCaptureForm } from '@/components/landing/EmailCaptureForm';
import { FilmProfileShowcase } from '@/components/landing/FilmProfileShowcase';
import Link from 'next/link';

export const dynamic = 'force-static';

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center">
      {/* ================================================
          Section 1: Hero — headline + visual transformation
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

          {/* Before/after transformation placeholder */}
          <div className="w-full max-w-[600px] aspect-[16/9] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center">
            <div className="flex items-center gap-[var(--space-section)]">
              <div className="flex flex-col items-center gap-[var(--space-tight)]">
                <div className="w-16 h-16 rounded-[var(--radius-card)] bg-[var(--color-surface)] opacity-30" />
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">Before</span>
              </div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-ink-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
              <div className="flex flex-col items-center gap-[var(--space-tight)]">
                <div className="w-16 h-16 rounded-[var(--radius-card)] bg-[var(--color-action-subtle)] opacity-60" />
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)]">After</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center gap-[var(--space-element)] mt-[var(--space-component)]">
            <a
              href="#signup"
              className="inline-flex items-center justify-center h-14 px-[var(--space-region)] bg-[var(--color-action)] text-[var(--color-ink-inverse)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-semibold text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-action-hover)] active:scale-[0.98] shadow-[var(--shadow-floating)]"
            >
              Get Started Free
            </a>
            <Link
              href="/feed"
              className="inline-flex items-center justify-center h-14 px-[var(--space-region)] border border-[var(--color-border-strong)] text-[var(--color-ink)] rounded-[var(--radius-sharp)] font-[family-name:var(--font-body)] font-medium text-[length:var(--text-body)] tracking-[0.02em] transition-all duration-150 ease-out hover:bg-[var(--color-surface-raised)] active:scale-[0.98]"
            >
              Try the Demo
            </Link>
          </div>

          <p className="text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] font-[family-name:var(--font-body)] font-light">
            No credit card required. Your first roll of prints is free.
          </p>
        </div>
      </section>

      {/* ================================================
          Section 2: Problem Statement
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[900px] mx-auto flex flex-col md:flex-row items-center gap-[var(--space-region)]">
          {/* Lifestyle image placeholder */}
          <div className="w-full md:w-1/2 aspect-[4/3] rounded-[var(--radius-card)] overflow-hidden bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center">
            <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
              Lifestyle image
            </span>
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-component)]">
              <span className="font-[family-name:var(--font-mono)]">30,000</span> photos on your phone.
              <br />
              Zero on your wall.
            </h2>
            <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-lead)] text-[var(--color-ink-secondary)] leading-[1.6] max-w-[45ch]">
              The good ones are buried under screenshots, duplicates, and blurry shots.
              Nothing gets printed. Nothing gets shared.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 3: Social Proof — Testimonial
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[600px] mx-auto">
          <div className="rounded-[var(--radius-card)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-floating)] p-[var(--space-region)] text-center">
            <svg className="mx-auto mb-[var(--space-component)] text-[var(--color-action)]" width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M11.3 2.3c-.4-.2-.8-.3-1.3-.3C7.2 2 5 4.7 5 8c0 2 .7 3.7 2 5v6c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3v-6c0-1.7-1.3-3-3-3H9.3C9.1 8.7 9 7.4 9 6c0-1.1.3-2.1.8-2.8l1.5.1zm10 0c-.4-.2-.8-.3-1.3-.3-2.8 0-5 2.7-5 6 0 2 .7 3.7 2 5v6c0 1.7 1.3 3 3 3h2c1.7 0 3-1.3 3-3v-6c0-1.7-1.3-3-3-3h-2.7c-.2-1.3-.3-2.6-.3-4 0-1.1.3-2.1.8-2.8l1.5.1z" /></svg>
            <blockquote className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)] leading-[1.5] mb-[var(--space-component)]">
              I finally printed photos of my kids. They&apos;re on the fridge now, not buried in my phone.
            </blockquote>
            <div className="flex items-center justify-center gap-[var(--space-element)]">
              {/* Optional avatar placeholder */}
              <div className="w-10 h-10 rounded-full bg-[var(--color-surface-sunken)] flex items-center justify-center">
                <span className="font-[family-name:var(--font-body)] font-medium text-[length:var(--text-label)] text-[var(--color-ink-tertiary)]">S</span>
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
          Section 4: How Roll Works — Film Strip Metaphor
          ================================================ */}
      <section className="w-full py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[1100px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-region)] px-[var(--space-component)]">
            How Roll works
          </h2>

          {/* Film strip container */}
          <div className="relative">
            {/* Sprocket holes — top */}
            <div className="flex justify-around px-[var(--space-section)] py-[var(--space-tight)] bg-[var(--color-filmstrip)]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={`top-${i}`} className="w-3 h-2 rounded-sm bg-[var(--color-sprocket)] opacity-60" />
              ))}
            </div>

            {/* Steps */}
            <div
              className="flex gap-0 overflow-x-auto bg-[var(--color-filmstrip)]"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
            >
              {[
                {
                  step: '1',
                  title: 'Upload',
                  body: 'Drop in your camera roll — Roll filters out the noise automatically.',
                  visual: 'scanning-grid',
                  visualLabel: 'Camera roll scanning',
                },
                {
                  step: '2',
                  title: 'Curate',
                  body: 'Heart your favorites and fill a roll of 36 — like loading real film.',
                  visual: 'curate-grid',
                  visualLabel: 'Photos with checkmarks',
                },
                {
                  step: '3',
                  title: 'Develop',
                  body: 'Choose a film stock and hit develop — every shot gets color-corrected.',
                  visual: 'before-after',
                  visualLabel: 'Before/after split',
                },
                {
                  step: '4',
                  title: 'Keep',
                  body: 'Order prints, create books, share to your Circle, or write the story.',
                  visual: 'prints-envelope',
                  visualLabel: 'Prints in envelope',
                },
              ].map(({ step, title, body, visual, visualLabel }) => (
                <div
                  key={step}
                  className="flex-shrink-0 w-[260px] md:w-[275px] p-[var(--space-element)]"
                  style={{ scrollSnapAlign: 'start' }}
                >
                  <div className="rounded-[var(--radius-card)] bg-[var(--color-surface)] overflow-hidden h-full flex flex-col">
                    {/* Step visual */}
                    <div className="w-full aspect-[4/3] bg-[var(--color-surface-sunken)] flex items-center justify-center relative overflow-hidden">
                      {visual === 'scanning-grid' && (
                        <div className="grid grid-cols-3 gap-1 p-3 w-full h-full">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="bg-[var(--color-surface)] rounded-sm opacity-40" />
                          ))}
                          {/* Scanning overlay */}
                          <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-action)] to-transparent opacity-10" style={{ height: '40%' }} />
                        </div>
                      )}
                      {visual === 'curate-grid' && (
                        <div className="grid grid-cols-3 gap-1 p-3 w-full h-full">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className={`rounded-sm relative ${i < 4 ? 'bg-[var(--color-surface)] opacity-60' : 'bg-[var(--color-surface)] opacity-20'}`}>
                              {i < 4 && (
                                <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                                  <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {visual === 'before-after' && (
                        <div className="flex w-full h-full">
                          <div className="w-1/2 bg-[var(--color-surface)] opacity-30 flex items-center justify-center">
                            <span className="font-[family-name:var(--font-mono)] text-[8px] text-[var(--color-ink-tertiary)] uppercase">Flat</span>
                          </div>
                          <div className="w-0.5 bg-white opacity-60" />
                          <div className="w-1/2 bg-[var(--color-action-subtle)] opacity-50 flex items-center justify-center preview-warmth">
                            <span className="font-[family-name:var(--font-mono)] text-[8px] text-[var(--color-ink-tertiary)] uppercase">Film</span>
                          </div>
                        </div>
                      )}
                      {visual === 'prints-envelope' && (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="w-14 h-10 bg-[var(--color-surface)] rounded-sm shadow-[var(--shadow-raised)] opacity-60 rotate-[-3deg]" />
                          <div className="w-16 h-10 bg-[var(--color-surface)] rounded-sm shadow-[var(--shadow-raised)] opacity-50 -mt-3" />
                          <span className="font-[family-name:var(--font-mono)] text-[8px] text-[var(--color-ink-tertiary)] uppercase mt-1">{visualLabel}</span>
                        </div>
                      )}
                    </div>
                    {/* Step info */}
                    <div className="p-[var(--space-element)] flex flex-col gap-[var(--space-tight)] flex-1">
                      <div className="flex items-baseline gap-[var(--space-tight)]">
                        <span className="font-[family-name:var(--font-mono)] font-bold text-[length:var(--text-heading)] text-[var(--color-action)]">
                          {step}
                        </span>
                        <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)]">
                          {title}
                        </h3>
                      </div>
                      <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] leading-[1.5]">
                        {body}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Sprocket holes — bottom */}
            <div className="flex justify-around px-[var(--space-section)] py-[var(--space-tight)] bg-[var(--color-filmstrip)]">
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={`bottom-${i}`} className="w-3 h-2 rounded-sm bg-[var(--color-sprocket)] opacity-60" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 5: Film Profiles — Full-Width Showcase
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
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
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
        <div className="max-w-[900px] mx-auto">
          <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-title)] text-[var(--color-ink)] text-center mb-[var(--space-region)]">
            From screen to something real
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-section)]">
            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-full aspect-[4/3] rounded-[var(--radius-card)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
                  Prints photo
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Prints
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                High-quality 4&times;6 prints delivered to your door. Your first roll is free.
              </p>
            </div>

            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-full aspect-[4/3] rounded-[var(--radius-card)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
                  Books photo
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Books
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Turn your favorites into a hardcover photo book. Flip through it in the app or order a printed copy.
              </p>
            </div>

            <div className="text-center flex flex-col items-center gap-[var(--space-element)]">
              <div className="w-full aspect-[4/3] rounded-[var(--radius-card)] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] flex items-center justify-center overflow-hidden">
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] tracking-wide uppercase">
                  Circle photo
                </span>
              </div>
              <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-lead)] text-[var(--color-ink)]">
                Circle
              </h3>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.6]">
                Share your best photos with family and friends in a private feed. No ads. No algorithm.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          Section 7: Privacy — Elevated with warm treatment
          ================================================ */}
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[700px] mx-auto">
          <div className="rounded-[var(--radius-modal)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-floating)] p-[var(--space-region)] md:p-[var(--space-page)]">
            <div className="flex items-center justify-center mb-[var(--space-section)]">
              <div className="w-14 h-14 rounded-full bg-[var(--color-developed)] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
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
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
      <section className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)] bg-[var(--color-surface-raised)]">
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-developed)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  1 film stock (Warmth)
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-developed)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  First 36 prints free
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-developed)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  1 private Circle
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-developed)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
                <span className="font-[family-name:var(--font-mono)] text-[length:var(--text-body)] text-[var(--color-action)]">$4.99/mo</span>
              </div>
              <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)] mb-[var(--space-component)] leading-[1.5]">
                Unlimited rolls developed monthly. Prints delivered to your door. Your best photos — always backed up.
              </p>
              <ul className="flex flex-col gap-[var(--space-tight)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-label)] text-[var(--color-ink-secondary)]">
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  All 6 film stocks
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Unlimited rolls and cloud backup
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Photo Books from your favorites
                </li>
                <li className="flex items-center gap-[var(--space-tight)]">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-action)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
      <section id="signup" className="w-full px-[var(--space-component)] md:px-[var(--space-section)] py-[var(--space-page)] md:py-[var(--space-hero)]">
        <div className="max-w-[500px] mx-auto flex flex-col items-center text-center gap-[var(--space-section)]">
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
