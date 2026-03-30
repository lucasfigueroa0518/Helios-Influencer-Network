import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Helios Influencer Network (HIN)',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
        <p className="mb-10 text-sm text-muted-foreground">Last updated: March 30, 2026</p>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">1. Introduction</h2>
          <p className="text-muted-foreground">
            HELIOS MARKETING LLC (&quot;HIN&quot;, &quot;we&quot;, &quot;us&quot;, or
            &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains
            how we collect, use, disclose, and safeguard your information when you use our platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">2. Information We Collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>
              <strong className="text-foreground">Account Information:</strong> Name, email address,
              and password when you create an account.
            </li>
            <li>
              <strong className="text-foreground">Profile Data:</strong> Influencer personas,
              content preferences, and platform configurations you create within HIN.
            </li>
            <li>
              <strong className="text-foreground">Usage Data:</strong> How you interact with our
              platform, including features used and actions taken.
            </li>
            <li>
              <strong className="text-foreground">Third-Party Integrations:</strong> If you connect
              Instagram or other social media accounts, we collect data necessary to operate those
              integrations.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">3. How We Use Your Information</h2>
          <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
            <li>To provide, operate, and maintain the HIN platform.</li>
            <li>To authenticate your account and keep it secure.</li>
            <li>To power AI-driven features and persona management.</li>
            <li>To communicate with you about updates, support, and service changes.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">4. Sharing Your Information</h2>
          <p className="text-muted-foreground">
            We do not sell your personal information. We may share data with trusted third-party
            service providers (such as Supabase for database hosting) solely to operate our
            platform. These providers are contractually obligated to protect your data.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">5. Data Retention</h2>
          <p className="text-muted-foreground">
            We retain your data for as long as your account is active or as needed to provide
            services. You may request deletion of your account and associated data at any time by
            contacting us.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">6. Security</h2>
          <p className="text-muted-foreground">
            We implement industry-standard security measures to protect your information. However,
            no method of transmission over the internet is 100% secure, and we cannot guarantee
            absolute security.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">7. Your Rights</h2>
          <p className="text-muted-foreground">
            Depending on your location, you may have rights to access, correct, or delete your
            personal data. To exercise these rights, contact us at the email below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">8. Changes to This Policy</h2>
          <p className="text-muted-foreground">
            We may update this Privacy Policy from time to time. We will notify you of significant
            changes by updating the date at the top of this page.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">9. Contact Us</h2>
          <p className="text-muted-foreground">
            If you have questions about this Privacy Policy, please contact us at{' '}
            <a
              href="mailto:heliosmarketingg@gmail.com"
              className="text-primary underline underline-offset-4"
            >
              heliosmarketingg@gmail.com
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
