"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import type { SharedPiece } from "@/lib/shared";

/**
 * One piece, from someone else's vault or collection. Full screen on a
 * phone, like the app's piece view; a two-column panel on a desktop, photos
 * left and the record right. Only fields the share returns are here —
 * price and value never cross the boundary.
 */
export function PieceSheet({
  piece,
  owner,
  onClose,
  onGallery,
  inline = false,
}: {
  piece: SharedPiece;
  owner: string;
  onClose?: () => void;
  onGallery?: () => void;
  /** A page of its own (a shared piece link) rather than an overlay. */
  inline?: boolean;
}) {
  const [photo, setPhoto] = useState(0);
  useEffect(() => {
    if (inline || !onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, inline]);

  const facts = (
    [
      ["condition", piece.condition],
      ["size", piece.size],
      ["year", piece.year],
      ["season", piece.season],
      ["made in", piece.made_in],
      ["materials", piece.materials],
      ["found", [piece.acquired_where, piece.acquired_at?.slice(0, 4)].filter(Boolean).join(", ") || null],
    ] as [string, string | null][]
  ).filter(([, v]) => !!v) as [string, string][];
  const photos = piece.photos ?? [];

  return (
    <div
      className={inline ? "font-th-sans" : "fixed inset-0 z-[85] font-th-sans"}
      role={inline ? undefined : "dialog"}
      aria-modal={inline ? undefined : true}
      aria-label={piece.name ?? piece.type}
    >
      {!inline && <button aria-label="close" onClick={onClose} className="absolute inset-0 hidden animate-[fadeIn_200ms_ease-out] bg-black/40 lg:block" />}
      <div
        className={
          inline
            ? "lg:mx-8 lg:mt-10 lg:flex lg:overflow-hidden lg:rounded-[24px] lg:border lg:border-th-border"
            : "absolute inset-0 overflow-y-auto bg-th-bg animate-[sheetUp_300ms_cubic-bezier(0.2,0.8,0.2,1)] lg:inset-auto lg:left-1/2 lg:top-1/2 lg:flex lg:max-h-[86dvh] lg:w-[min(1040px,92vw)] lg:-translate-x-1/2 lg:-translate-y-1/2 lg:animate-[fadeIn_220ms_ease-out] lg:overflow-hidden lg:rounded-[24px]"
        }
      >
        {/* Photos */}
        <div className="relative lg:w-[55%] lg:shrink-0 lg:bg-th-surface">
          <div className="aspect-[4/5] w-full bg-th-chip lg:aspect-auto lg:h-full">
            {photos[photo] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photos[photo]} alt={piece.name ?? piece.type} className="h-full w-full object-cover" />
            ) : null}
          </div>
          {!inline && (
            <button
              onClick={onClose}
              aria-label="close"
              className="absolute left-5 top-[calc(env(safe-area-inset-top)+12px)] flex h-11 w-11 items-center justify-center rounded-th-chip bg-th-chip-on-media text-th-ink lg:hidden"
            >
              <Icon name="close" size={21} />
            </button>
          )}
          {photos.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
              {photos.map((_, i) => (
                <button
                  key={i}
                  aria-label={`photo ${i + 1}`}
                  onClick={() => setPhoto(i)}
                  className={`h-1.5 rounded-full transition-all ${i === photo ? "w-5 bg-white" : "w-1.5 bg-white/60"}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* The record */}
        <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+32px)] pt-6 lg:flex-1 lg:overflow-y-auto lg:px-8 lg:pt-8">
          {!inline && (
            <div className="hidden justify-end lg:flex">
              <button onClick={onClose} aria-label="close" className="flex h-11 w-11 items-center justify-center rounded-th-chip bg-th-chip">
                <Icon name="close" size={21} />
              </button>
            </div>
          )}
          <p className="font-th-label font-light text-[11px] uppercase tracking-[0.1em] text-th-muted">
            {piece.brand} · @{owner}
          </p>
          <h2 className="mt-2 text-[28px] font-bold leading-8 tracking-[-0.02em]">{piece.name ?? piece.type}</h2>
          {piece.name && <p className="mt-1.5 text-[13px] text-th-muted">{piece.type}</p>}

          {facts.length > 0 && (
            <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-4">
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="font-th-label font-light text-[10px] uppercase tracking-[0.12em] text-th-muted">{k}</dt>
                  <dd className="mt-1 text-[15px] capitalize text-th-ink">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {piece.story && (
            <div className="mt-8 border-l-2 border-th-accent pl-5">
              {piece.story.split("\n\n").map((para, i) => (
                <p key={i} className="mb-3 text-[15px] leading-relaxed text-th-ink">
                  {para}
                </p>
              ))}
            </div>
          )}

          {onGallery && (
            <button onClick={onGallery} className="mt-8 inline-flex h-10 items-center gap-2 rounded-full bg-th-chip px-[18px] text-[13px] font-semibold">
              <Icon name="expand" size={15} /> view in gallery
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
