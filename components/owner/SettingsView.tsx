"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { NavGroup, NavRow, SectionHead } from "@/components/profile/kit";
import { signOut } from "@/lib/actions/auth";
import { APP_STORE_URL } from "@/lib/app-store";
import { shareUrl, type ShareState } from "@/lib/share-state";

const LEGAL = [
  { label: "terms of service", href: "/terms" },
  { label: "privacy policy", href: "/privacy" },
  { label: "trust & security", href: "/security" },
];

/** d•••@gmail.com */
function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name[0] ?? ""}•••@${domain}`;
}

/**
 * Settings — the app's (threadology-native/app/(main)/settings.tsx):
 * account, the vault's sharing, legal, and sign out, which lives only here.
 * The profile editor moved to its own screen, /profile/edit.
 */
export function SettingsView({
  userId,
  username,
  email,
  share: initialShare,
}: {
  userId: string;
  username: string;
  email: string | null;
  share: ShareState;
}) {
  const [share, setShare] = useState(initialShare);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const on = share.visibility === "link_only" && !!share.token;
  const url = on ? shareUrl("vault", username, share.token!, null) : null;

  async function copy() {
    if (!url) return;
    await navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="font-th-sans">
      <ScreenHeader title="settings" back={{ href: "/profile" }} />
      <div className="th-page flex flex-col gap-7 pb-10 pt-3">
        <section>
          <SectionHead label="account" />
          <NavGroup>
            <NavRow title="edit profile" sub="photo, bio" href="/profile/edit" />
            {email && <NavRow title="sign-in" sub={`email · ${maskEmail(email)}`} />}
            <NavRow title="get the iPhone app" sub="the whole archive, in your pocket" href={APP_STORE_URL} />
          </NavGroup>
        </section>

        <section>
          <SectionHead label="vault sharing" />
          <NavGroup>
            <NavRow title="shared link" sub={on ? (share.hasPassword ? "on · password protected" : "on") : "off"} onClick={() => setSharing(true)} />
            {on && <NavRow title={copied ? "copied" : "copy link"} onClick={copy} />}
          </NavGroup>
        </section>

        <section>
          <SectionHead label="legal" />
          <NavGroup>
            {LEGAL.map((l) => (
              <NavRow key={l.href} title={l.label} href={l.href} />
            ))}
          </NavGroup>
        </section>

        <form action={signOut}>
          <NavGroup>
            <NavRow title="sign out" danger />
          </NavGroup>
        </form>
      </div>

      <Sheet open={sharing} title="share vault" onClose={() => setSharing(false)}>
        <ShareControl type="vault" id={userId} username={username} initial={share} onChange={setShare} />
      </Sheet>
    </div>
  );
}
