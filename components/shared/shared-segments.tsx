"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { SharedPieces, type SharedPiece } from "@/components/shared/shared-pieces";
import type { SharedCollectionSummary, SharedFitSummary } from "@/lib/shared";

/**
 * The segmented feed from doc 4's profile, in its visitor state.
 *
 * Only segments with something in them are offered. A visitor should not be
 * given a tab that opens onto nothing, and an owner who shares no fits should
 * not have the page announce that they have none.
 *
 * Collections and fits link on with their own tokens, so navigating within a
 * shared vault stays inside the same token-gated read path.
 */
export function SharedSegments({
  username,
  pieces,
  collections,
  fits,
}: {
  username: string;
  pieces: SharedPiece[];
  collections: SharedCollectionSummary[];
  fits: SharedFitSummary[];
}) {
  const segments = [
    { id: "pieces" as const, label: "pieces", count: pieces.length },
    { id: "collections" as const, label: "collections", count: collections.length },
    { id: "fits" as const, label: "fits", count: fits.length },
  ].filter((s) => s.count > 0);

  const [active, setActive] = useState<"pieces" | "collections" | "fits">(
    segments[0]?.id ?? "pieces"
  );

  if (segments.length === 0) {
    return <p className="py-24 text-center text-sm text-[#6B6358]">Nothing here yet.</p>;
  }

  return (
    <>
      {segments.length > 1 && (
        <div className="mb-8 flex justify-center gap-7 border-b border-[#E8E5DE]">
          {segments.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`-mb-px border-b-2 pb-3 text-[14px] transition-colors ${
                active === s.id
                  ? "border-[#1B1A17] font-medium text-[#1B1A17]"
                  : "border-transparent text-[#6B6358] hover:text-[#1B1A17]"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {active === "pieces" && <SharedPieces pieces={pieces} />}

      {active === "collections" && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {collections.map((c) => (
            <li key={c.id}>
              <Link
                href={`/vault/${username}/c/${c.slug}?k=${c.share_token}`}
                className="block rounded-2xl border border-[#E8E5DE] bg-white p-4 transition-colors hover:border-[#1B1A17]"
              >
                <p className="text-[17px] font-semibold tracking-[-0.01em] text-[#1B1A17]">
                  {c.name}
                </p>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.1em] text-[#6B6358]">
                  {c.piece_count} {c.piece_count === 1 ? "piece" : "pieces"}
                </p>
                <div className="mt-3 flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="relative aspect-square flex-1 overflow-hidden rounded-lg bg-[#F2F0EC]"
                    >
                      {c.previews[i] && (
                        <Image
                          src={c.previews[i]}
                          alt=""
                          fill
                          sizes="(max-width: 640px) 25vw, 12vw"
                          className="object-cover"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {active === "fits" && (
        <ul className="flex flex-col gap-8">
          {fits.map((f) => (
            <li key={f.id}>
              <Link href={`/fit/${username}/${f.slug}?k=${f.share_token}`} className="block">
                <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#F2F0EC]">
                  {f.photos?.[0] && (
                    <Image
                      src={f.photos[0]}
                      alt={f.title ?? "fit"}
                      fill
                      sizes="(max-width: 768px) 100vw, 672px"
                      className="object-cover"
                    />
                  )}
                </div>
                <p className="mt-3 text-[17px] text-[#1B1A17]">{f.title ?? "untitled fit"}</p>
                {f.date && (
                  <p className="mt-0.5 text-[13px] text-[#6B6358]">
                    {new Date(f.date).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
