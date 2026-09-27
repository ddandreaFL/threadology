"use client";

import { useState } from "react";
import Link from "next/link";
import { ChipButton } from "@/components/ui/ChipButton";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import type { ShareState } from "@/lib/share-state";

export type OwnerFitDetail = {
  id: string;
  title: string | null;
  caption: string | null;
  date: string | null;
  location: string | null;
  photos: string[];
  worn: { id: string; name: string | null; type: string; brand: string; photo: string | null }[];
  reactions: { emoji: string; count: number }[];
  reactors: { emoji: string; username: string; created_at: string }[];
};

/**
 * One of your fits — the app's fit screen: the photo, then the date, the
 * title, the caption, what was worn, and what came back (reactions, and
 * who). Share from the chip.
 */
export function OwnerFitView({ fit, username, share }: { fit: OwnerFitDetail; username: string; share: ShareState }) {
  const [i, setI] = useState(0);
  const [sharing, setSharing] = useState(false);
  const date = fit.date ? new Date(fit.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;

  return (
    <div className="font-th-sans lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-8">
      <div className="relative lg:sticky lg:top-8 lg:self-start">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:rounded-[24px]"
          onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        >
          {fit.photos.map((src) => (
            <div key={src} className="aspect-[4/5] w-full shrink-0 snap-center bg-th-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={fit.title ?? "fit"} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        {fit.photos.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {fit.photos.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
        <div className="absolute left-5 right-5 top-[calc(env(safe-area-inset-top)+12px)] flex justify-between lg:hidden">
          <ChipButton icon="chevron-left" label="back" href="/fits" onMedia />
          <ChipButton icon="share" label="share" onClick={() => setSharing(true)} onMedia />
        </div>
      </div>

      <div className="px-5 pb-10 pt-6 lg:px-0 lg:pt-0">
        <div className="mb-6 hidden items-center justify-between lg:flex">
          <ChipButton icon="chevron-left" label="back" href="/fits" />
          <ChipButton icon="share" label="share" onClick={() => setSharing(true)} />
        </div>
        <p className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">{[date, fit.location].filter(Boolean).join(" · ") || " "}</p>
        <h1 className="mt-2 text-[28px] font-bold leading-8 tracking-[-0.02em] lg:text-[34px] lg:leading-[38px]">{fit.title || "untitled fit"}</h1>
        {fit.caption && <p className="mt-6 whitespace-pre-wrap border-l-2 border-th-accent pl-5 text-[16px] leading-relaxed">{fit.caption}</p>}

        {fit.worn.length > 0 && (
          <section className="mt-8">
            <h2 className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">worn</h2>
            <ul className="mt-3 space-y-3">
              {fit.worn.map((p) => (
                <li key={p.id}>
                  <Link href={`/pieces/${p.id}`} className="flex items-center gap-3 hover:opacity-80">
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-th-chip">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[15px]">{p.name ?? p.type}</span>
                      <span className="block truncate text-[12px] text-th-muted">{p.brand}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {fit.reactions.length > 0 && (
          <section className="mt-8">
            <h2 className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">reactions</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {fit.reactions.map((r) => (
                <span key={r.emoji} className="flex items-center gap-1.5 rounded-full border border-th-border px-3.5 py-2 text-[16px]">
                  {r.emoji} <span className="text-[12px] font-semibold text-th-muted">{r.count}</span>
                </span>
              ))}
            </div>
            {fit.reactors.length > 0 && (
              <ul className="mt-4 space-y-2.5">
                {fit.reactors.map((r) => (
                  <li key={`${r.username}-${r.emoji}`} className="flex items-center justify-between text-[14px]">
                    <span>@{r.username}</span>
                    <span className="text-[16px]">{r.emoji}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <Sheet open={sharing} title="share fit" onClose={() => setSharing(false)}>
        <ShareControl type="fit" id={fit.id} username={username} initial={share} />
      </Sheet>
    </div>
  );
}
