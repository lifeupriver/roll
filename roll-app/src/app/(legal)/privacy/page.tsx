import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Roll',
  description: 'How Roll collects, uses, and protects your personal information and photos.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-[720px] mx-auto px-[var(--space-component)] py-[var(--space-hero)]">
      <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-section)]">
        Privacy Policy
      </h1>
      <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-region)]">
        Last updated: February 23, 2026
      </p>

      {/* Plain-English Summary */}
      <div className="bg-[var(--color-surface-raised)] rounded-[var(--radius-card)] p-[var(--space-section)] mb-[var(--space-region)]">
        <h2 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-component)]">
          The short version
        </h2>
        <div className="flex flex-col gap-[var(--space-element)] font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.7]">
          <p>
            <strong className="text-[var(--color-ink)]">Do you sell my data?</strong> No. We never
            have and never will.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Do you show me ads?</strong> No. We make
            money from subscriptions and prints.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Do you train AI on my photos?</strong> No.
            Your photos are never used to train any model.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Can other people see my photos?</strong>{' '}
            Only if you share them to a Circle. There are no public profiles.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">
              What happens if I delete my account?
            </strong>{' '}
            Everything is permanently deleted. Photos, metadata, all of it.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Is my location data shared?</strong> No. GPS
            data from your photos is stored for the Map feature but never shared with other users.
          </p>
          <p>
            <strong className="text-[var(--color-ink)]">Who can see my photos?</strong> Only you —
            unless you share to a Circle, in which case only Circle members can see them.
          </p>
        </div>
      </div>

      <div className="prose-roll flex flex-col gap-[var(--space-region)]">
        <Section title="1. Who We Are">
          <p>
            Roll (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) operates the photo
            curation and print service at roll.photos. We are committed to protecting your privacy
            and your photos.
          </p>
        </Section>

        <Section title="2. Our Promise">
          <ul>
            <li>We do not sell your data.</li>
            <li>We do not serve ads.</li>
            <li>We do not train AI models on your photos.</li>
            <li>Your photos belong to you.</li>
          </ul>
        </Section>

        <Section title="3. Information We Collect">
          <h4>Account Information</h4>
          <p>
            When you create an account, we collect your email address. You may optionally provide a
            display name.
          </p>

          <h4>Photos &amp; Metadata</h4>
          <p>
            When you upload photos, we store the image files and associated EXIF metadata (date
            taken, GPS coordinates, camera model). EXIF GPS data is stored to power features like
            the Map view but is never shared with other users.
          </p>

          <h4>Usage Data</h4>
          <p>
            We collect anonymous usage analytics via PostHog to understand how people use Roll (page
            views, feature usage). We use Sentry for error tracking. No personal photos are included
            in analytics or error reports.
          </p>

          <h4>Payment Information</h4>
          <p>
            Payment processing is handled by Stripe. We do not store credit card numbers. Stripe may
            collect payment information subject to their privacy policy.
          </p>
        </Section>

        <Section title="4. How We Use Your Information">
          <ul>
            <li>To provide the Roll service (photo storage, filtering, processing, printing).</li>
            <li>
              To send transactional emails (magic links, order confirmations, shipping updates).
            </li>
            <li>To process print orders via our fulfillment partner Prodigi.</li>
            <li>To improve the service through anonymous usage analytics.</li>
          </ul>
        </Section>

        <Section title="5. How We Store Your Photos">
          <p>
            Original photos are stored in Cloudflare R2 with private access controls. Each photo is
            accessible only via time-limited signed URLs. Thumbnails (400px wide, WebP) are served
            via a public CDN for performance but are too low-resolution for printing.
          </p>
          <p>
            Processed (developed) photos are stored privately and accessed via signed URLs with a
            1-hour expiry. Photos shared to Circles are copied to an isolated storage path
            accessible only by circle members.
          </p>
        </Section>

        <Section title="6. Data Sharing">
          <p>We share your data only with:</p>
          <ul>
            <li>
              <strong>Prodigi</strong> — Our print fulfillment partner receives your shipping
              address and processed photo URLs (24-hour expiry) to fulfill print orders.
            </li>
            <li>
              <strong>Stripe</strong> — Payment processor for Roll+ subscriptions and print orders.
            </li>
            <li>
              <strong>Resend</strong> — Email delivery service for transactional emails only.
            </li>
          </ul>
          <p>
            We do not sell, rent, or trade your personal information or photos to any third party.
          </p>
        </Section>

        <Section title="7. Data Security">
          <p>
            We protect your data with HTTPS everywhere, HTTP-only secure cookies, Row Level Security
            on all database tables, signed URLs with expiration, and security headers including
            HSTS, CSP, and X-Frame-Options.
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>You can:</p>
          <ul>
            <li>Access and download your photos at any time.</li>
            <li>Delete your account and all associated data.</li>
            <li>Hide or recover filtered photos.</li>
            <li>Export your data by contacting us.</li>
          </ul>
        </Section>

        <Section title="9. Cookies">
          <p>
            We use essential cookies for authentication (HTTP-only secure session cookies via
            Supabase). We use localStorage for anonymous analytics (PostHog). We do not use
            third-party advertising cookies.
          </p>
        </Section>

        <Section title="10. Children&rsquo;s Privacy">
          <p>
            Roll is not intended for children under 13. We do not knowingly collect information from
            children under 13.
          </p>
        </Section>

        <Section title="11. Changes to This Policy">
          <p>
            We may update this policy from time to time. We will notify you of material changes via
            email or an in-app notice.
          </p>
        </Section>

        <Section title="12. Contact">
          <p>
            For privacy questions, email us at{' '}
            <a
              href="mailto:privacy@roll.photos"
              className="text-[var(--color-action)] hover:underline"
            >
              privacy@roll.photos
            </a>
            .
          </p>
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-[family-name:var(--font-display)] font-medium text-[length:var(--text-heading)] text-[var(--color-ink)] mb-[var(--space-element)]">
        {title}
      </h3>
      <div className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.7] flex flex-col gap-[var(--space-element)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-[var(--space-tight)] [&_h4]:font-medium [&_h4]:text-[var(--color-ink)] [&_h4]:mt-[var(--space-element)]">
        {children}
      </div>
    </section>
  );
}
