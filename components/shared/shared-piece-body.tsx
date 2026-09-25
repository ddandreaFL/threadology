"use client";

import { useState } from "react";
import Image from "next/image";
import type { SharedPieceData } from "@/lib/shared";

/**
 * One piece, shared on its own.
 *
 * Same rhythm as a shared fit — brand line, name, the piece's own line, then
 * labelled sections. The photos come first because that is what was sent.
 *
 * What is missing is deliberate: price paid is not in the table this page
 * reads from, and estimated value does not cross the boundary either.
 */
export function SharedPieceBody({ data }: { data: SharedPieceData }) {
  const { owner, piece } = data;
  const [photo, setPhoto] = useState(0);

  const facts = (
    [
      ["condition", piece.condition],
      ["size", piece.size],
      ["year", piece.year],
      ["season", piece.season],
      ["made in", piece.made_in],
      ["materials", piece.materials],
    ] as [string, string | null][]
  ).filter(([, v]) => !!v) as [string, string][];

  const provenance = [piece.acquired_where, piece.acquired_at?.slice(0, 4)]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="pb-16">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-[#111111]">
        {piece.photos?.[photo] && (
          <Image
            src={piece.photos[photo]}
            alt={piece.name ?? piece.type}
            fill
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-cover"
            priority
          />
        )}
      </div>

      {piece.photos?.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {piece.photos.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setPhoto(i)}
              aria-label={`photo ${i + 1}`}
              className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg ${
                i === photo ? "ring-2 ring-[#2D5A45]" : "opacity-60"
              }`}
            >
              <Image src={src} alt="" fill sizes="56px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <header className="pt-7">
        <p className="font-mono text-[11px] uppercase tracking-[0.11em] text-[#2D5A45]">
          {piece.brand}
        </p>
        <h1 className="mt-2 text-[30px] font-bold leading-tight tracking-[-0.02em] text-[#1B1A17]">
          {piece.name ?? piece.type}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.11em] text-[#6B6358]">
          {piece.type}
        </p>
        <p className="mt-3 text-[14px] text-[#6B6358]">{`from @${owner.username}'s archive`}</p>
      </header>

      {facts.length > 0 && (
        <section className="mt-7">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
            details
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {facts.map(([label, value]) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-[#FAFAFA] px-3 py-1.5"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB]">
                  {label}
                </span>
                <span className="text-[12px] font-semibold capitalize text-[#1B1A17]">{value}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {provenance && (
        <section className="mt-9">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
            acquired
          </h2>
          <p className="mt-2 text-[15px] text-[#1B1A17]">{provenance}</p>
        </section>
      )}

      {piece.story && (
        <section className="mt-9 border-l-2 border-[#2D5A45] pl-5">
          <h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2D5A45]">
            story
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.7] text-[#1B1A17]">
            {piece.story}
          </p>
        </section>
      )}
    </article>
  );
}
