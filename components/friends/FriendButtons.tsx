"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { removeFriend, respondFriendRequest, sendFriendRequest, type Relationship } from "@/lib/friends";

const pill = "inline-flex h-11 items-center rounded-th-chip px-[18px] text-[14px] font-medium disabled:opacity-60";
const primary = `${pill} bg-th-accent text-th-on-ink hover:bg-th-accent-pressed`;
const quiet = `${pill} bg-th-chip text-th-ink hover:bg-th-chip-pressed`;

/**
 * The one button that changes as the relationship does: add friend →
 * requested; accept / decline; friends ✓. Taking back and removing ask
 * first. Every change re-reads the page, since becoming friends changes
 * what the profile shows.
 */
export function FriendButtons({ username, relationship }: { username: string; relationship: Relationship }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function act(call: () => Promise<Relationship | null>) {
    setBusy(true);
    const next = await call();
    setBusy(false);
    if (next === null) {
      window.alert("Couldn't do that. Try again.");
      return;
    }
    router.refresh();
  }

  if (relationship === "self") return null;
  if (relationship === "incoming") {
    return (
      <div className="flex gap-2">
        <button type="button" disabled={busy} className={primary} onClick={() => act(() => respondFriendRequest(supabase, username, true))}>
          accept
        </button>
        <button type="button" disabled={busy} className={quiet} onClick={() => act(() => respondFriendRequest(supabase, username, false))}>
          decline
        </button>
      </div>
    );
  }
  if (relationship === "friends") {
    return (
      <button
        type="button"
        disabled={busy}
        className={quiet}
        onClick={() => window.confirm(`Remove @${username}? You'll stop seeing each other's archives.`) && act(() => removeFriend(supabase, username))}
      >
        friends ✓
      </button>
    );
  }
  if (relationship === "requested") {
    return (
      <button
        type="button"
        disabled={busy}
        className={quiet}
        onClick={() => window.confirm("Take back your friend request?") && act(() => removeFriend(supabase, username))}
      >
        requested
      </button>
    );
  }
  return (
    <button type="button" disabled={busy} className={primary} onClick={() => act(() => sendFriendRequest(supabase, username))}>
      add friend
    </button>
  );
}

/** Accept or decline, inline in a list of requests. */
export function RequestActions({ username }: { username: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function answer(accept: boolean) {
    setBusy(true);
    await respondFriendRequest(supabase, username, accept);
    setBusy(false);
    router.refresh();
  }
  return (
    <span className="flex shrink-0 items-center gap-2">
      <button type="button" disabled={busy} onClick={() => answer(true)} className="h-9 rounded-th-inline-chip bg-th-accent px-3.5 text-[14px] font-medium text-th-on-ink hover:bg-th-accent-pressed disabled:opacity-60">
        accept
      </button>
      <button type="button" disabled={busy} onClick={() => answer(false)} aria-label="decline" className="h-9 rounded-th-inline-chip px-2.5 text-[14px] text-th-muted hover:bg-th-chip">
        ✕
      </button>
    </span>
  );
}
