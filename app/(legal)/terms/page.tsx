import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service — Threadology" };

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-8 text-[15px] font-semibold text-[#111111]">{children}</h2>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[14px] leading-relaxed text-[#555555]">{children}</p>;
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[14px] leading-relaxed text-[#555555]">
      <span className="shrink-0 text-[#CCCCCC]">—</span>
      <span>{children}</span>
    </li>
  );
}

function Ul({ children }: { children: React.ReactNode }) {
  return <ul className="mb-4 space-y-2">{children}</ul>;
}

export default function TermsPage() {
  return (
    <>
      <h1 className="mb-1 text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">
        Terms of Service
      </h1>
      <span className="mb-10 block text-[12px] text-[#999999]">Last updated: April 2026</span>

      <H2>Agreement</H2>
      <P>
        By using Threadology, you agree to these terms. If you don&apos;t agree, don&apos;t use the
        service.
      </P>

      <H2>Eligibility</H2>
      <P>You must be at least 13 years old to use Threadology.</P>

      <H2>Your Account</H2>
      <Ul>
        <Li>You&apos;re responsible for keeping your login credentials secure</Li>
        <Li>One account per person</Li>
        <Li>You&apos;re responsible for all activity under your account</Li>
        <Li>Don&apos;t share accounts or sell access</Li>
      </Ul>

      <H2>Your Content</H2>
      <P>
        <strong className="font-semibold text-[#111111]">You own your content.</strong> Photos,
        stories, and data you upload remain yours.
      </P>
      <P>By uploading content, you grant Threadology a license to:</P>
      <Ul>
        <Li>Store and display your content within the app</Li>
        <Li>Show your public vault to others via your vault link</Li>
        <Li>Create backups for service reliability</Li>
      </Ul>
      <P>This license ends when you delete your content or account.</P>

      <H2>Acceptable Use</H2>
      <P>Don&apos;t:</P>
      <Ul>
        <Li>Upload content you don&apos;t have rights to</Li>
        <Li>Post illegal, harmful, or abusive content</Li>
        <Li>Attempt to access other users&apos; data</Li>
        <Li>Scrape or bulk-download content</Li>
        <Li>Use the service for commercial resale without permission</Li>
        <Li>Circumvent usage limits or security measures</Li>
      </Ul>

      <H2>Premium Subscription</H2>
      <Ul>
        <Li>Premium is billed monthly ($8/month) or annually ($60/year)</Li>
        <Li>Subscriptions auto-renew until cancelled</Li>
        <Li>Cancel anytime; access continues until the billing period ends</Li>
        <Li>
          Refunds follow App Store/Play Store policies for mobile; web refunds at our discretion
          within 7 days
        </Li>
      </Ul>

      <H2>Free Tier Limits</H2>
      <P>Free accounts are limited to:</P>
      <Ul>
        <Li>25 pieces</Li>
        <Li>3 collections</Li>
      </Ul>
      <P>Exceeding limits requires a Premium subscription.</P>

      <H2>Termination</H2>
      <P>
        We may suspend or terminate accounts that violate these terms. You may delete your account
        anytime via Settings.
      </P>

      <H2>Service Availability</H2>
      <P>
        We aim for high availability but don&apos;t guarantee uninterrupted service. We may modify
        or discontinue features with notice.
      </P>

      <H2>Disclaimers</H2>
      <P>
        Threadology is provided &ldquo;as is&rdquo; without warranties. We don&apos;t guarantee:
      </P>
      <Ul>
        <Li>Accuracy of user-submitted content</Li>
        <Li>Authenticity or value of documented pieces</Li>
        <Li>Continuous, error-free operation</Li>
      </Ul>

      <H2>Limitation of Liability</H2>
      <P>
        To the maximum extent permitted by law, Threadology&apos;s liability is limited to the
        amount you paid us in the past 12 months.
      </P>

      <H2>Disputes</H2>
      <P>
        These terms are governed by the laws of the State of California. Disputes will be resolved
        through binding arbitration, except where prohibited.
      </P>

      <H2>Changes</H2>
      <P>
        We may update these terms. Continued use after changes constitutes acceptance.
      </P>

      <H2>Contact</H2>
      <P>
        Questions? Email{" "}
        <a href="mailto:legal@threadology.co" className="text-[#111111] underline">
          legal@threadology.co
        </a>
      </P>
    </>
  );
}
