"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { Section } from "./kit";

/**
 * Reactions on a fit — the web's copy of the app's section.
 *
 * They work the way Discord's do: tap a chip to add your reaction to it or
 * take it back, "+" to add any other emoji; one person can leave several.
 * react_to_fit() checks the share token every time, so a reaction can only
 * land on a fit the viewer was sent. The owner can't react to their own fit;
 * they see the totals, who reacted, and the full list.
 */

export type Reaction = { emoji: string; count: number; mine: boolean };
export type Reactor = { emoji: string; username: string; avatar_url?: string | null; created_at: string };

const QUICK = ["🔥", "❤️", "👑", "🥶", "🫡", "👀"];
const MORE = [
  "😍", "🤩", "😎", "🥹", "😂", "🤌", "👏", "🙌",
  "💯", "✨", "⭐️", "💫", "🌟", "⚡️", "💥", "🪩",
  "🤍", "🖤", "💚", "💙", "💜", "🧡", "💛", "🩶",
  "👍", "👌", "🤝", "💪", "🙏", "🫶", "✌️", "🤘",
  "😮", "🤯", "😭", "🥲", "😤", "🫠", "🤔", "👻",
  "🧢", "👟", "🧥", "👖", "🕶️", "💎", "🌿", "🍂",
  "🦕", "🐐", "🌳", "🔒", "📸", "🎯", "🏆", "🚀",
];

export function ReactionsSection({
  owner,
  initial,
  reactors = [],
  token,
  friendFitId,
  signedIn = false,
}: {
  owner: boolean;
  initial: Reaction[];
  reactors?: Reactor[];
  token?: string;
  /** A friend: react through the friendship rather than a token. */
  friendFitId?: string;
  signedIn?: boolean;
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initial);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [listing, setListing] = useState(false);
  const canReact = !owner && signedIn && (!!token || !!friendFitId);
  const people = distinctPeople(reactors);

  if (owner && reactions.length === 0) return null;

  async function toggle(emoji: string) {
    if (!canReact || busy) return;
    setBusy(true);
    const before = reactions;
    const current = before.find((r) => r.emoji === emoji);
    setReactions(
      current
        ? current.mine
          ? before.map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r)).filter((r) => r.count > 0)
          : before.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r))
        : [...before, { emoji, count: 1, mine: true }]
    );
    const { data, error } = friendFitId
      ? await supabase.rpc("react_to_friend_fit" as never, { p_fit_id: friendFitId, p_emoji: emoji } as never)
      : await supabase.rpc("react_to_fit" as never, { p_token: token, p_emoji: emoji } as never);
    setBusy(false);
    if (error) return setReactions(before);
    if (Array.isArray(data)) setReactions(data as Reaction[]);
  }

  function pick(emoji: string) {
    setPicking(false);
    // Picking one you already left is not a request to take it back.
    if (reactions.find((r) => r.emoji === emoji)?.mine) return;
    toggle(emoji);
  }

  const meta = owner
    ? people.length
      ? `${people.length} ${people.length === 1 ? "person" : "people"}`
      : undefined
    : canReact
      ? "tap to react"
      : undefined;

  return (
    <Section label="reactions" meta={meta}>
      <div className="flex flex-wrap gap-2">
        {reactions.map((r) => (
          <button
            key={r.emoji}
            type="button"
            onClick={() => toggle(r.emoji)}
            disabled={!canReact}
            aria-pressed={r.mine}
            aria-label={`${r.emoji} ${r.count}`}
            className={`flex h-11 min-w-16 items-center justify-center gap-2 rounded-th-chip px-3.5 transition-colors ${
              r.mine ? "bg-th-chip-pressed shadow-[inset_0_0_0_1.5px_#1B1A17]" : "bg-th-chip"
            } ${canReact ? "hover:bg-th-chip-pressed" : "cursor-default"}`}
          >
            <span className="text-[18px]">{r.emoji}</span>
            <span className="text-[16px] font-medium">{r.count}</span>
          </button>
        ))}
        {canReact && (
          <button type="button" onClick={() => setPicking(true)} aria-label="Add a reaction" className="flex h-11 w-11 items-center justify-center rounded-th-chip bg-th-chip hover:bg-th-chip-pressed">
            <Icon name="plus" size={18} />
          </button>
        )}
      </div>

      {!owner && !signedIn && (
        <p className="mt-2.5 text-[13px] text-th-muted">
          <Link href="/signup" className="font-medium text-th-accent hover:underline">
            Sign up
          </Link>{" "}
          to react to this fit.
        </p>
      )}

      {owner && people.length > 0 && (
        <button
          type="button"
          onClick={() => setListing(true)}
          className="mt-4 flex w-full items-center gap-3 border-t border-th-border pt-4 text-left hover:opacity-80"
        >
          <span className="flex">
            {people.slice(0, 5).map((p, n) => (
              <span key={p.username} className="relative" style={{ marginLeft: n ? -6 : 0, zIndex: 5 - n }}>
                <Avatar person={p} />
                <span className="absolute -bottom-1 -right-1 text-[11px]">{p.emoji}</span>
              </span>
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-medium leading-[19px]">{names(people)}</span>
            <span suppressHydrationWarning className="block text-[13px] leading-[17px] text-th-muted">latest {timeAgo(reactors[0].created_at)}</span>
          </span>
          <Icon name="chevron-right" size={16} className="text-th-muted" />
        </button>
      )}

      <Sheet open={picking} onClose={() => setPicking(false)} title="react">
        <Picker onPick={pick} />
      </Sheet>
      <Sheet open={listing} onClose={() => setListing(false)} title="reactions">
        <ul>
          {reactors.map((r) => (
            <li key={`${r.username}-${r.emoji}`} className="flex items-center gap-3 py-2.5">
              <Avatar person={r} />
              <Link href={`/u/${r.username}`} className="flex-1 truncate text-[15px] hover:underline">
                @{r.username}
              </Link>
              <span className="text-[18px]">{r.emoji}</span>
              <span suppressHydrationWarning className="w-16 text-right text-[13px] text-th-muted">{timeAgo(r.created_at)}</span>
            </li>
          ))}
        </ul>
      </Sheet>
    </Section>
  );
}

function Picker({ onPick }: { onPick: (emoji: string) => void }) {
  const [typed, setTyped] = useState("");
  const emoji = firstEmoji(typed);
  const cell = (e: string) => (
    <button key={e} type="button" onClick={() => onPick(e)} aria-label={e} className="flex aspect-square items-center justify-center rounded-th-chip text-[26px] hover:bg-th-chip">
      {e}
    </button>
  );
  return (
    <div>
      <div className="grid grid-cols-8">{QUICK.map(cell)}</div>
      <div className="my-2 h-px bg-th-border" />
      <div className="grid grid-cols-8">{MORE.map(cell)}</div>
      <form
        className="mt-3 flex gap-2.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (emoji) onPick(emoji);
        }}
      >
        <input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="or type any emoji"
          className="h-11 min-w-0 flex-1 rounded-th-chip bg-th-surface px-3.5 text-[18px] outline-none placeholder:text-[15px] placeholder:text-th-muted"
        />
        <button type="submit" disabled={!emoji} className={`h-11 rounded-th-chip px-4 text-[14px] font-medium ${emoji ? "bg-th-accent text-th-on-ink" : "bg-th-chip text-th-muted"}`}>
          {emoji ? `add ${emoji}` : "add"}
        </button>
      </form>
    </div>
  );
}

/** The first emoji typed, or null for letters, digits and plain punctuation. */
function firstEmoji(s: string): string | null {
  const v = s.trim();
  if (!v || /[A-Za-z0-9]/.test(v)) return null;
  const Seg = (Intl as unknown as { Segmenter?: new (l?: string, o?: { granularity: string }) => { segment(s: string): Iterable<{ segment: string }> } }).Segmenter;
  const first = Seg ? Array.from(new Seg(undefined, { granularity: "grapheme" }).segment(v))[0]?.segment : Array.from(v)[0];
  if (!first || first.length > 16 || /^[\x00-\x7F]+$/.test(first)) return null;
  return first;
}

type Person = { username: string; avatar_url?: string | null; emoji: string };

function distinctPeople(reactors: Reactor[]): Person[] {
  const seen = new Map<string, Person>();
  for (const r of reactors) if (!seen.has(r.username)) seen.set(r.username, r);
  return Array.from(seen.values());
}

function names(people: Person[]) {
  const h = people.map((p) => `@${p.username}`);
  if (h.length === 1) return h[0];
  if (h.length === 2) return `${h[0]} and ${h[1]}`;
  const rest = h.length - 2;
  return `${h[0]}, ${h[1]} and ${rest} ${rest === 1 ? "other" : "others"}`;
}

function Avatar({ person }: { person: { username: string; avatar_url?: string | null } }) {
  return (
    <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-th-chip">
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="th-label">{person.username.slice(0, 1)}</span>
      )}
    </span>
  );
}

function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
