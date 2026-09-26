import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy — Threadology" };

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

export default function PrivacyPage() {
  return (
    <>
      <h1 className="mb-1 text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">
        Privacy Policy
      </h1>
      <span className="mb-10 block text-[12px] text-[#999999]">Last updated: April 2026</span>

      <H2>What We Collect</H2>

      <p className="mb-2 text-[13px] font-semibold text-[#111111]">Account Information</p>
      <Ul>
        <Li>Email address (required for account creation)</Li>
        <Li>Username (chosen by you)</Li>
        <Li>Profile photo (optional)</Li>
      </Ul>

      <p className="mb-2 text-[13px] font-semibold text-[#111111]">Wardrobe Data</p>
      <Ul>
        <Li>Photos you upload of your pieces</Li>
        <Li>Piece details you enter (brand, year, condition, story, etc.)</Li>
        <Li>Collections you create</Li>
        <Li>Hunt list items</Li>
      </Ul>

      <p className="mb-2 text-[13px] font-semibold text-[#111111]">Usage Data</p>
      <Ul>
        <Li>How you interact with the app (features used, screens visited)</Li>
        <Li>Device information (model, OS version)</Li>
        <Li>Crash reports and performance data</Li>
      </Ul>

      <H2>How We Use It</H2>
      <Ul>
        <Li>To provide and improve the Threadology service</Li>
        <Li>To display your vault and pieces</Li>
        <Li>To enable sharing via vault links</Li>
        <Li>To send transactional emails (password reset, account updates)</Li>
        <Li>To analyze app performance and fix bugs</Li>
      </Ul>
      <P>We do not sell your personal data to third parties.</P>

      <H2>Third-Party Services</H2>
      <P>We use these services to run Threadology:</P>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-[#EBEBEB] pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#999999]">Service</th>
              <th className="border-b border-[#EBEBEB] pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#999999]">Purpose</th>
              <th className="border-b border-[#EBEBEB] pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#999999]">Data Shared</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Supabase", "Database, auth, image storage", "Account info, photos, piece data"],
              ["Vercel", "Web hosting", "Usage logs, IP address"],
              ["Expo", "App updates, crash reports", "Device info, crash logs"],
            ].map(([service, purpose, data]) => (
              <tr key={service}>
                <td className="border-b border-[#F0F0F0] py-3 pr-4 align-top text-[13px] font-medium text-[#111111]">{service}</td>
                <td className="border-b border-[#F0F0F0] py-3 pr-4 align-top text-[13px] text-[#555555]">{purpose}</td>
                <td className="border-b border-[#F0F0F0] py-3 align-top text-[13px] text-[#555555]">{data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Data Storage</H2>
      <P>
        Your data is stored on servers in the United States via Supabase. Images are stored in
        Supabase Storage with CDN distribution.
      </P>

      <H2>Your Rights</H2>
      <Ul>
        <Li><strong className="font-semibold text-[#111111]">Access</strong> your data anytime in the app</Li>
        <Li><strong className="font-semibold text-[#111111]">Export</strong> your vault data (feature coming soon)</Li>
        <Li><strong className="font-semibold text-[#111111]">Delete</strong> your account and all associated data</Li>
        <Li><strong className="font-semibold text-[#111111]">Correct</strong> any information via your profile settings</Li>
      </Ul>
      <P>
        To delete your account, go to Settings → Delete Account, or email{" "}
        <a href="mailto:privacy@threadology.co" className="text-[#111111] underline">
          privacy@threadology.co
        </a>
        .
      </P>

      <H2>Data Retention</H2>
      <P>
        We keep your data as long as your account is active. If you delete your account, we remove
        your data within 30 days, except where required by law.
      </P>

      <H2>Children</H2>
      <P>
        Threadology is not intended for users under 13. We do not knowingly collect data from
        children.
      </P>

      <H2>Changes</H2>
      <P>
        We may update this policy. Material changes will be communicated via email or in-app notice.
      </P>

      <H2>Contact</H2>
      <P>
        Questions? Email{" "}
        <a href="mailto:privacy@threadology.co" className="text-[#111111] underline">
          privacy@threadology.co
        </a>
      </P>
    </>
  );
}
