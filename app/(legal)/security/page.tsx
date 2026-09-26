import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trust & Security — Threadology" };

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

export default function SecurityPage() {
  return (
    <>
      <h1 className="mb-1 text-[28px] font-semibold tracking-[-0.02em] text-[#111111]">
        Trust &amp; Security
      </h1>
      <span className="mb-10 block text-[12px] text-[#999999]">Last updated: April 2026</span>

      <H2>Our Commitment</H2>
      <P>Your wardrobe data is personal. We treat it that way.</P>

      <H2>Encryption</H2>
      <Ul>
        <Li>
          <strong className="font-semibold text-[#111111]">In transit:</strong> All data encrypted
          via TLS 1.3
        </Li>
        <Li>
          <strong className="font-semibold text-[#111111]">At rest:</strong> Database and storage
          encrypted via AES-256
        </Li>
      </Ul>

      <H2>Authentication</H2>
      <Ul>
        <Li>Passwords hashed using bcrypt</Li>
        <Li>Sign in with Apple supported</Li>
        <Li>Session tokens stored securely (SecureStore on iOS, httpOnly cookies on web)</Li>
      </Ul>

      <H2>Access Control</H2>
      <Ul>
        <Li>Row-level security (RLS) on all database tables</Li>
        <Li>You can only access your own data</Li>
        <Li>Admin access is logged and limited to essential operations</Li>
      </Ul>

      <H2>Infrastructure</H2>
      <div className="mb-6 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border-b border-[#EBEBEB] pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#999999]">
                Provider
              </th>
              <th className="border-b border-[#EBEBEB] pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#999999]">
                Security
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Supabase", "SOC 2 Type II compliant"],
              ["Vercel", "SOC 2 Type II compliant"],
            ].map(([provider, security]) => (
              <tr key={provider}>
                <td className="border-b border-[#F0F0F0] py-3 pr-6 align-top text-[13px] font-medium text-[#111111]">
                  {provider}
                </td>
                <td className="border-b border-[#F0F0F0] py-3 align-top text-[13px] text-[#555555]">
                  {security}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <H2>Your Photos</H2>
      <Ul>
        <Li>Private by default</Li>
        <Li>Only visible to others if you share your vault link</Li>
        <Li>Stored in isolated cloud storage with access controls</Li>
      </Ul>

      <H2>Incident Response</H2>
      <P>In the unlikely event of a data breach:</P>
      <Ul>
        <Li>We will notify affected users within 72 hours</Li>
        <Li>We will disclose the nature and scope of the incident</Li>
        <Li>We will take immediate steps to contain and remediate</Li>
      </Ul>

      <H2>Reporting Issues</H2>
      <P>
        Found a security issue? Email{" "}
        <a href="mailto:security@threadology.co" className="text-[#111111] underline">
          security@threadology.co
        </a>
        . We take all reports seriously.
      </P>
    </>
  );
}
