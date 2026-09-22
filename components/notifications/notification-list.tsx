"use client";

import { useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * The inbox.
 *
 * Three things reach it, and each line names what happened rather than
 * announcing itself: pieces added to something you saved, a reaction on your
 * fit, someone saving something of yours. A line opens onto the thing it is
 * about — for an addition that means the link you saved, which is why the
 * feed hands back the token you were given rather than a bare id.
 *
 * Everything is marked read on open. An inbox that keeps score of what you
 * have looked at is a second thing to manage.
 */

export type NotificationRow = {
  id: string;
  kind: "addition" | "reaction" | "save";
  container_type: "vault" | "collection" | "fit";
  container_id: string;
  piece_count: number;
  emoji: string | null;
  created_at: string;
  read_at: string | null;
  actor_username: string | null;
  actor_avatar: string | null;
  title: string | null;
  slug: string | null;
  owner_username: string | null;
  thumbnail: string | null;
  share_token: string | null;
};

export function NotificationList({ initial }: { initial: NotificationRow[] }) {
  const unread = useMemo(() => initial.filter((r) => !r.read_at).length, [initial]);

  useEffect(() => {
    if (unread === 0) return;
    supabase.rpc("mark_notifications_read" as never, { p_ids: null } as never);
  }, [unread]);

  if (initial.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-[15px] text-[#111111]">Nothing yet.</p>
        <p className="mt-2 text-[14px] text-[#999999]">
          Save a link someone sends you and you will hear about it here when it grows.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#F0F0F0]">
      {initial.map((n) => (
        <li key={n.id}>
          <Row n={n} />
        </li>
      ))}
    </ul>
  );
}

function Row({ n }: { n: NotificationRow }) {
  const href = targetHref(n);
  const body = (
    <div className={`flex items-center gap-3 py-4 ${href ? "transition-opacity hover:opacity-70" : ""}`}>
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#F2F0EC]">
        {n.thumbnail && <Image src={n.thumbnail} alt="" fill sizes="48px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-snug text-[#111111]">{describe(n)}</p>
        <p className="mt-0.5 text-[13px] text-[#999999]">{ago(n.created_at)}</p>
      </div>
      {!n.read_at && <span className="h-2 w-2 shrink-0 rounded-full bg-[#2D5A45]" />}
    </div>
  );

  return href ? <Link href={href}>{body}</Link> : body;
}

function describe(n: NotificationRow): string {
  const who = n.actor_username ? `@${n.actor_username}` : "someone";
  const what = n.title ?? "something";
  if (n.kind === "addition") {
    return `${n.piece_count} ${n.piece_count === 1 ? "piece" : "pieces"} added to ${what}`;
  }
  if (n.kind === "reaction") return `${who} reacted ${n.emoji ?? ""} to ${what}`;
  return `${who} saved ${what}`;
}

/**
 * An addition opens through the token on your own save. Anything else is
 * about something you own, so it opens on your own screen — and a fit has
 * none on the web, which is where the app takes over.
 */
function targetHref(n: NotificationRow): string | null {
  if (n.kind === "addition") {
    if (!n.share_token || !n.owner_username) return null;
    if (n.container_type === "vault") return `/vault/${n.owner_username}?k=${n.share_token}`;
    if (n.container_type === "collection")
      return `/vault/${n.owner_username}/c/${n.slug}?k=${n.share_token}`;
    return `/fit/${n.owner_username}/${n.slug}?k=${n.share_token}`;
  }
  if (n.container_type === "collection") return "/collections";
  if (n.container_type === "vault") return "/vault";
  return null;
}

function ago(iso: string): string {
  const seconds = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
