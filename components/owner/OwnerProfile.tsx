"use client";

import { useState } from "react";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { useUnread } from "@/components/ui/useUnread";
import { signOut } from "@/lib/actions/auth";
import type { ShareState } from "@/lib/share-state";

/**
 * You — the app's profile tab: avatar, name and bio, the count, then the
 * places the app keeps here (saved, notifications) and the vault's sharing.
 */
export function OwnerProfile({
  userId,
  username,
  avatarUrl,
  bio,
  since,
  pieceCount,
  share,
}: {
  userId: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  since: number;
  pieceCount: number;
  share: ShareState;
}) {
  const unread = useUnread();
  const [sharing, setSharing] = useState(false);

  const row = (label: string, opts: { href?: string; onClick?: () => void; dot?: boolean; danger?: boolean }) => {
    const inner = (
      <span className="flex h-[52px] items-center justify-between px-4">
        <span className={`flex items-center gap-2 text-[15px] ${opts.danger ? "text-th-danger" : ""}`}>
          {label}
          {opts.dot && <span className="h-2 w-2 rounded-full bg-th-accent" />}
        </span>
        {!opts.danger && <Icon name="chevron-right" size={18} className="text-th-muted" />}
      </span>
    );
    return opts.href ? (
      <Link href={opts.href} className="block hover:bg-th-chip-pressed/50">
        {inner}
      </Link>
    ) : (
      <button onClick={opts.onClick} className="block w-full text-left hover:bg-th-chip-pressed/50">
        {inner}
      </button>
    );
  };
  const group = "overflow-hidden rounded-th-card bg-th-surface divide-y divide-th-border";

  return (
    <div className="font-th-sans lg:mx-auto lg:max-w-xl">
      <ScreenHeader
        title="profile"
        subtitle={`collecting since ${since}`}
        actions={[
          { icon: "share", label: "share vault", onClick: () => setSharing(true) },
          { icon: "pencil", label: "edit profile", href: "/settings" },
        ]}
      />
      <div className="flex flex-col items-center px-5 pt-2">
        <div className="flex h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full bg-[#1A1A1A] text-[32px] text-th-avatar-glyph">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            username[0]?.toUpperCase()
          )}
        </div>
        <p className="mt-3 text-[17px] font-medium">@{username}</p>
        {bio && <p className="mt-1 text-center text-[14px] text-th-muted">{bio}</p>}
      </div>

      <div className="space-y-3 px-4 pb-10 pt-6">
        <div className="rounded-th-card bg-th-surface py-5 text-center">
          <p className="text-[28px] font-bold">{pieceCount}</p>
          <p className="text-[13px] text-th-muted">{pieceCount === 1 ? "piece" : "pieces"}</p>
        </div>
        <div className={group}>
          {row("saved", { href: "/saved" })}
          {row("notifications", { href: "/notifications", dot: unread })}
        </div>
        <div className={group}>
          {row("share vault", { onClick: () => setSharing(true) })}
          {row("settings", { href: "/settings" })}
        </div>
        <form action={signOut} className={group}>
          <button className="block w-full text-left hover:bg-th-chip-pressed/50">
            <span className="flex h-[52px] items-center px-4 text-[15px] text-th-danger">sign out</span>
          </button>
        </form>
      </div>

      <Sheet open={sharing} title="share vault" onClose={() => setSharing(false)}>
        <ShareControl type="vault" id={userId} username={username} initial={share} />
      </Sheet>
    </div>
  );
}
