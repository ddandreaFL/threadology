"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * The pieces of a shared container, and the overlay one opens into.
 *
 * A piece has no page of its own yet: doc 3's /piece/<user>/<slug> needs a
 * slug column that does not exist, so a piece opens as an overlay fed by the
 * container's own data. Reachability comes for free — the viewer is already
 * holding a token for a container this piece belongs to.
 */

export type SharedPiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  season: string | null;
  size: string | null;
  condition: string | null;
  story: string | null;
  photos: string[];
  materials: string | null;
  acquired_where: string | null;
  acquired_at: string | null;
};

export function SharedPieces({ pieces }: { pieces: SharedPiece[] }) {
  const [open, setOpen] = useState<SharedPiece | null>(null);

  if (pieces.length === 0) {
    return (
      <p className="py-24 text-center text-sm text-[#6B6358]">Nothing here yet.</p>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {pieces.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => setOpen(p)}
              className="group block w-full text-left"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#F2F0EC]">
                {p.photos?.[0] && (
                  <Image
                    src={p.photos[0]}
                    alt={p.name ?? p.type}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                )}
              </div>
              <p className="mt-3 truncate text-[15px] text-[#1B1A17]">{p.name ?? p.type}</p>
              <p className="mt-0.5 truncate text-[13px] text-[#6B6358]">
                {[p.brand, p.year].filter(Boolean).join(" · ")}
              </p>
            </button>
          </li>
        ))}
      </ul>

      {open && <PieceOverlay piece={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function PieceOverlay({ piece, onClose }: { piece: SharedPiece; onClose: () => void }) {
  const [photo, setPhoto] = useState(0);

  // Facts only where they exist. No "unknown" placeholders — an archive entry
  // that says nothing about size simply does not mention size.
  const facts = [
    ["condition", piece.condition],
    ["size", piece.size],
    ["year", piece.year],
    ["season", piece.season],
    ["materials", piece.materials],
  ].filter(([, v]) => !!v) as [string, string][];

  const provenance = [piece.acquired_where, piece.acquired_at?.slice(0, 4)]
    .filter(Boolean)
    .join(", ");

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#FDFCFA]"
      role="dialog"
      aria-modal="true"
      aria-label={piece.name ?? piece.type}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="close"
        className="fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F2F0EC]/92 text-[#1B1A17] backdrop-blur"
      >
        <span className="text-lg leading-none">×</span>
      </button>

      <div className="mx-auto max-w-2xl pb-24">
        <div className="relative aspect-[4/5] w-full bg-[#111111]">
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
          <div className="flex gap-2 px-5 pt-3">
            {piece.photos.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setPhoto(i)}
                aria-label={`photo ${i + 1}`}
                className={`relative h-14 w-14 overflow-hidden rounded-lg ${
                  i === photo ? "ring-2 ring-[#2D5A45]" : "opacity-60"
                }`}
              >
                <Image src={src} alt="" fill sizes="56px" className="object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="px-5 pt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.11em] text-[#2D5A45]">
            {piece.brand}
          </p>
          <h2 className="mt-2 text-[28px] font-bold leading-tight tracking-[-0.02em] text-[#1B1A17]">
            {piece.name ?? piece.type}
          </h2>
          <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.11em] text-[#6B6358]">
            {piece.type}
          </p>

          {facts.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {facts.map(([label, value]) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#E8E5DE] bg-[#FAFAFA] px-3 py-1.5"
                >
                  <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB]">
                    {label}
                  </span>
                  <span className="text-[12px] font-semibold text-[#1B1A17]">{value}</span>
                </span>
              ))}
            </div>
          )}

          {/* Where it came from crosses the boundary; what was paid never
              does, and is not in the data this page receives. */}
          {provenance && (
            <div className="mt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6B6358]">
                acquired
              </p>
              <p className="mt-2 text-[15px] text-[#1B1A17]">{provenance}</p>
            </div>
          )}

          {piece.story && (
            <div className="mt-8 border-l-2 border-[#2D5A45] pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#2D5A45]">
                story
              </p>
              <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.7] text-[#1B1A17]">
                {piece.story}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
