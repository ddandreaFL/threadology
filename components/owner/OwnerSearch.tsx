"use client";

import { useMemo, useState } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PieceCard } from "@/components/ui/PieceCard";

export type SearchPiece = { id: string; brand: string; type: string; name: string | null; year: string | null; photo: string | null };
export type SearchFit = { id: string; title: string | null; photo: string | null };

/**
 * Search — the app's search screen: one field over your pieces (name,
 * brand, type, year) and fits (title), filtered as you type.
 */
export function OwnerSearch({ pieces, fits }: { pieces: SearchPiece[]; fits: SearchFit[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const hitPieces = useMemo(
    () =>
      query
        ? pieces.filter((p) => [p.name, p.brand, p.type, p.year].some((v) => (v ?? "").toLowerCase().includes(query)))
        : [],
    [pieces, query]
  );
  const hitFits = useMemo(() => (query ? fits.filter((f) => (f.title ?? "").toLowerCase().includes(query)) : []), [fits, query]);

  return (
    <div className="font-th-sans">
      <ScreenHeader title="search" back={{ href: "/vault" }} />
      <div className="px-5 lg:px-8">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="brand, name, type, year"
          className="w-full rounded-th-chip bg-th-surface px-4 py-3 text-[16px] outline-none placeholder:text-[#B8B8B8]"
        />
      </div>

      {query && hitPieces.length === 0 && hitFits.length === 0 && <p className="py-20 text-center text-[13px] text-[#999999]">no results</p>}

      {hitPieces.length > 0 && (
        <section className="mt-6">
          <p className="px-5 font-th-label font-light text-[11px] uppercase tracking-[0.1em] text-th-muted lg:px-8">pieces · {hitPieces.length}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-[22px] px-3 md:grid-cols-3 lg:grid-cols-5 lg:px-8">
            {hitPieces.map((p) => (
              <PieceCard key={p.id} href={`/pieces/${p.id}`} photo={p.photo} title={p.name ?? p.type} subtitle={p.brand} />
            ))}
          </div>
        </section>
      )}
      {hitFits.length > 0 && (
        <section className="mt-8">
          <p className="px-5 font-th-label font-light text-[11px] uppercase tracking-[0.1em] text-th-muted lg:px-8">fits · {hitFits.length}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-[22px] px-3 md:grid-cols-3 lg:grid-cols-5 lg:px-8">
            {hitFits.map((f) => (
              <PieceCard key={f.id} href={`/fits/${f.id}`} photo={f.photo} title={f.title || "untitled fit"} aspect="portrait" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
