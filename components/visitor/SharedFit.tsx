"use client";

import { useState, type ReactNode } from "react";
import { FitReactions } from "@/components/shared/fit-reactions";
import type { SharedFitData } from "@/lib/shared";

/**
 * A shared fit, as the app shows one: the photo edge to edge, then the date,
 * the title, the caption, what was worn, and the reactions — the one place
 * in the product that answers back. On a desktop, photos left and the rest
 * right.
 */
export function SharedFit({ data, token, save, nudge }: { data: SharedFitData; token: string; save: ReactNode; nudge?: ReactNode }) {
  const { fit, pieces, owner } = data;
  const photos = fit.photos ?? [];
  const [i, setI] = useState(0);
  const date = fit.date ? new Date(fit.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : null;
  const worn = [...pieces].sort((a, b) => a.layer_order - b.layer_order);

  return (
    <article className="lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-10">
      <div className="relative">
        <div
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] lg:rounded-[24px]"
          onScroll={(e) => {
            const el = e.currentTarget;
            setI(Math.round(el.scrollLeft / el.clientWidth));
          }}
        >
          {photos.map((src) => (
            <div key={src} className="aspect-[4/5] w-full shrink-0 snap-center bg-th-chip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={fit.title ?? "fit"} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {photos.map((_, n) => (
              <span key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 pt-6 lg:px-0 lg:pt-2">
        <p className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">
          @{owner.username}
          {date ? ` · ${date}` : ""}
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-8 tracking-[-0.02em] lg:text-[34px] lg:leading-[38px]">{fit.title || "untitled fit"}</h1>

        {fit.caption && (
          <p className="mt-6 whitespace-pre-wrap border-l-2 border-th-accent pl-5 text-[16px] leading-relaxed">{fit.caption}</p>
        )}

        {worn.length > 0 && (
          <section className="mt-8">
            <h2 className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">worn</h2>
            <ul className="mt-3 space-y-3">
              {worn.map((p) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-th-chip">
                    {p.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[15px]">{p.name ?? p.type}</span>
                    <span className="block truncate text-[12px] text-th-muted">{[p.brand, p.size].filter(Boolean).join(" · ")}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <FitReactions token={token} initial={data.reactions ?? []} signedIn={!!data.viewer?.signed_in} />
        <div className="mt-8">{save}</div>
        {nudge}
      </div>
    </article>
  );
}
