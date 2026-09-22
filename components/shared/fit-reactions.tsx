"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

/**
 * Reactions on a shared fit.
 *
 * A fit someone sends you is the one thing in the archive that invites a
 * reply, so this is the only surface with one. A fixed set of emoji rather
 * than a picker: the point is a reaction, not a comment thread, and a closed
 * set keeps the row the same height whatever it holds.
 *
 * Reacting needs an account — a link alone cannot make a reaction
 * attributable or undoable — so a signed-out visitor sees the counts and is
 * offered a way in rather than a control that fails when tapped.
 */

export const REACTION_SET = ["🔥", "❤️", "👑", "🥶", "🫡", "👀"] as const;

export type Reaction = { emoji: string; count: number; mine: boolean };

export function FitReactions({
  token,
  initial,
  signedIn,
}: {
  token?: string;
  initial: Reaction[];
  signedIn: boolean;
}) {
  const [reactions, setReactions] = useState<Reaction[]>(initial);
  const [busy, setBusy] = useState<string | null>(null);

  const by = new Map(reactions.map((r) => [r.emoji, r]));
  // The standard set, plus anything already on the fit that is not in it —
  // the set can change without orphaning reactions left under the old one.
  const shown = [
    ...REACTION_SET,
    ...reactions.map((r) => r.emoji).filter((e) => !REACTION_SET.includes(e as never)),
  ];

  async function toggle(emoji: string) {
    if (!signedIn || !token || busy) return;
    setBusy(emoji);

    // Optimistic: the tap should land before the round trip does.
    const before = reactions;
    const current = by.get(emoji);
    setReactions(
      current
        ? current.mine
          ? reactions
              .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, mine: false } : r))
              .filter((r) => r.count > 0)
          : reactions.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1, mine: true } : r))
        : [...reactions, { emoji, count: 1, mine: true }]
    );

    const { data, error } = await supabase.rpc("react_to_fit" as never, {
      p_token: token,
      p_emoji: emoji,
    } as never);

    setBusy(null);
    if (error) {
      setReactions(before);
      return;
    }
    if (Array.isArray(data)) setReactions(data as Reaction[]);
  }

  return (
    <section className="mt-9">
      <div className="flex flex-wrap gap-2">
        {shown.map((emoji) => {
          const r = by.get(emoji);
          const mine = !!r?.mine;
          return (
            <button
              key={emoji}
              type="button"
              onClick={() => toggle(emoji)}
              disabled={!signedIn}
              aria-pressed={mine}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[15px] transition-colors ${
                mine
                  ? "border-[#2D5A45] bg-[#EDF6F1]"
                  : "border-[#E8E5DE] bg-white hover:border-[#1B1A17]"
              } ${signedIn ? "" : "cursor-default"}`}
            >
              <span>{emoji}</span>
              {r?.count ? (
                <span
                  className={`text-[12px] font-semibold ${mine ? "text-[#2D5A45]" : "text-[#6B6358]"}`}
                >
                  {r.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {!signedIn && (
        <p className="mt-3 text-[13px] text-[#6B6358]">
          <Link href="/signup" className="font-medium text-[#2D5A45] underline-offset-2 hover:underline">
            Sign up
          </Link>{" "}
          to react to this fit.
        </p>
      )}
    </section>
  );
}
