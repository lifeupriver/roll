import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Roll',
  description: 'Terms and conditions for using the Roll photo curation and print service.',
};

export default function TermsOfServicePage() {
  return (
    <main className="max-w-[720px] mx-auto px-[var(--space-component)] py-[var(--space-hero)]">
      <h1 className="font-[family-name:var(--font-display)] font-bold text-[length:var(--text-title)] text-[var(--color-ink)] mb-[var(--space-section)]">
        Terms of Service
      </h1>
      <p className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-caption)] text-[var(--color-ink-tertiary)] mb-[var(--space-region)]">
        Last updated: February 23, 2026
      </p>

      <div className="flex flex-col gap-[var(--space-region)]">
        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using Roll (&ldquo;the Service&rdquo;), you agree to be bound by these
            Terms of Service. If you do not agree, do not use the Service.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p>
            Roll is a photo curation and print service. You upload photos, we filter out low-quality
            images, you select your favorites to fill a &ldquo;roll,&rdquo; we apply film-style
            processing, and you can order physical prints.
          </p>
        </Section>

        <Section title="3. Accounts">
          <ul>
            <li>You must provide a valid email address to create an account.</li>
            <li>You are responsible for maintaining the security of your account.</li>
            <li>You must be at least 13 years old to use the Service.</li>
            <li>One person or legal entity may maintain no more than one free account.</li>
          </ul>
        </Section>

        <Section title="4. Your Content">
          <p>
            <strong>Ownership:</strong> You retain all rights to your photos. We do not claim
            ownership of any content you upload.
          </p>
          <p>
            <strong>License:</strong> By uploading photos, you grant Roll a limited license to
            store, process, display (to you and your Circle members), and transmit your photos
            solely for the purpose of providing the Service. This license ends when you delete your
            content or account.
          </p>
          <p>
            <strong>Responsibility:</strong> You represent that you have the right to upload the
            content and that it does not violate any laws or third-party rights. You must not upload
            content that is illegal, harmful, or violates others&rsquo; rights.
          </p>
        </Section>

        <Section title="5. Free and Paid Plans">
          <p>
            <strong>Free plan:</strong> Includes photo upload, filtering, one roll development with
            the Warmth profile, and your first 36 prints free.
          </p>
          <p>
            <strong>Roll+ ($4.99/month):</strong> Includes all six film profiles, unlimited
            processing, Circle creation, album printing, and cloud backup. Subscriptions are billed
            monthly via Stripe and can be cancelled at any time.
          </p>
          <p>
            <strong>Prints:</strong> Print orders are fulfilled by Prodigi. Delivery times are
            estimates and may vary. Print quality is subject to the resolution of your original
            photos.
          </p>
        </Section>

        <Section title="6. Free First Roll Offer">
          <p>
            New users receive up to 36 4&times;6 prints from their first developed roll at no cost,
            including shipping. This offer is limited to one per person and may be modified or
            discontinued at any time.
          </p>
        </Section>

        <Section title="7. Circles">
          <p>
            Circles are private sharing groups. By sharing a photo to a Circle, you grant other
            Circle members the ability to view and order prints of that photo. Circle creators are
            responsible for who they invite.
          </p>
        </Section>

        <Section title="8. Prohibited Uses">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service for any illegal purpose.</li>
            <li>Upload content that infringes on intellectual property rights.</li>
            <li>Attempt to gain unauthorized access to the Service or its systems.</li>
            <li>
              Use automated systems to access the Service in a manner that exceeds reasonable use.
            </li>
            <li>Interfere with or disrupt the Service.</li>
          </ul>
        </Section>

        <Section title="9. Termination">
          <p>
            We may suspend or terminate your account if you violate these Terms. You may delete your
            account at any time from Account settings. Upon deletion, your photos and data will be
            permanently removed within 30 days.
          </p>
        </Section>

        <Section title="10. Disclaimers">
          <p>
            The Service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not
            guarantee that the Service will be uninterrupted or error-free. Photo processing results
            (filtering, film profiles) are algorithmic and may not meet every expectation.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the maximum extent permitted by law, Roll shall not be liable for any indirect,
            incidental, special, or consequential damages arising from your use of the Service. Our
            total liability shall not exceed the amount you have paid us in the 12 months preceding
            the claim.
          </p>
        </Section>

        <Section title="12. Changes to Terms">
          <p>
            We may update these Terms from time to time. We will notify you of material changes via
            email. Continued use of the Service after changes constitutes acceptance.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            For questions about these Terms, email us at{' '}
            <a
              href="mailto:hello@roll.photos"
              className="text-[var(--color-action)] hover:underline"
            >
              hello@roll.photos
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
      <div className="font-[family-name:var(--font-body)] font-light text-[length:var(--text-body)] text-[var(--color-ink-secondary)] leading-[1.7] flex flex-col gap-[var(--space-element)] [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-[var(--space-tight)]">
        {children}
      </div>
    </section>
  );
}
