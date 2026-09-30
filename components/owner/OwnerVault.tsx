"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { PieceCard } from "@/components/ui/PieceCard";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";
import { Gallery, type GalleryPiece } from "@/components/gallery/Gallery";
import { useViewMode } from "./useViewMode";
import { plural, withoutEmoji } from "@/lib/text";

export type OwnerPiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  photo: string | null;
  collectionIds: string[];
};
export type OwnerCollection = { id: string; name: string };

/**
 * Your vault — the app's vault tab (threadology-native/app/(main)/(tabs)/
 * vault.tsx): the collection chips, the cover flow with its caption and pen,
 * or the grid, and gallery mode over the whole vault or one collection.
 */
export function OwnerVault({ pieces, collections }: { pieces: OwnerPiece[]; collections: OwnerCollection[] }) {
  const view = useViewMode("vault_view_mode");
  const [active, setActive] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [gallery, setGallery] = useState<{ start: number; origin: DOMRect | null; scope: string | null } | null>(null);
  const cf = useRef<CoverflowHandle>(null);

  const shown = useMemo(() => (active ? pieces.filter((p) => p.collectionIds.includes(active)) : pieces), [pieces, active]);
  const piece = shown[Math.min(index, shown.length - 1)];
  const activeName = active ? withoutEmoji(collections.find((c) => c.id === active)?.name ?? "") : null;

  const toGallery = (list: OwnerPiece[]): GalleryPiece[] =>
    list.map((p) => ({ id: p.id, photo: p.photo, title: p.name ?? p.type, brand: p.brand, year: p.year }));

  if (pieces.length === 0) {
    return (
      <div className="font-th-sans">
        <ScreenHeader title="vault" subtitle="0 pieces" />
        <div className="flex flex-col items-center px-10 py-24 text-center">
          <p className="text-4xl text-[#CCCCCC]">✦</p>
          <p className="mt-4 text-[1.375rem] font-semibold tracking-[-0.02em]">your vault awaits</p>
          <p className="mt-2 text-[0.875rem] text-th-muted">start archiving the pieces that define your style</p>
          <Link href="/vault/add" className="mt-7 rounded-th-pill bg-[#1A1A1A] px-7 py-3.5 text-[0.875rem] font-medium text-white">
            add your first piece →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="font-th-sans">
      <ScreenHeader
        title="vault"
        subtitle={activeName ? `${plural(shown.length, "piece")} in ${activeName}` : plural(pieces.length, "piece")}
        actions={[{ icon: "search", label: "search", href: "/search" }, view.action]}
      />

      {collections.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] lg:px-8">
          {[{ id: null as string | null, name: "all" }, ...collections].map((c) => (
            <button
              key={c.id ?? "all"}
              onClick={() => {
                setActive(c.id);
                setIndex(0);
              }}
              aria-pressed={active === c.id}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[0.8125rem] transition-colors ${
                active === c.id ? "bg-[#1A1A1A] text-white" : "border border-[#EBEBEB] text-[#999999] hover:text-th-ink"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="py-24 text-center text-[0.875rem] text-th-muted">This collection is empty.</p>
      ) : view.mode === "coverflow" ? (
        <div className="pt-4 lg:pt-8">
          <Coverflow
            key={active ?? "all"}
            ref={cf}
            items={shown.map((p) => ({ id: p.id, photo: p.photo, alt: p.name ?? p.type }))}
            index={index}
            onIndexChange={setIndex}
            onCardClick={(i) => (i === index ? (window.location.href = `/pieces/${shown[i].id}`) : cf.current?.flyTo(i, "glide"))}
            maxCardWidth={400}
            hiddenIndex={gallery?.origin ? index : null}
          />
          <div className="mt-4 px-5 text-center">
            <div className="relative inline-block max-w-full">
              <p className="truncate text-[0.875rem] font-semibold tracking-[-0.0125rem] lg:text-[1.0625rem]">{piece ? piece.name ?? piece.type : " "}</p>
              {piece && (
                <Link href={`/pieces/${piece.id}/edit`} aria-label="edit piece" className="absolute -right-8 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center text-th-muted hover:text-th-ink">
                  <Icon name="pencil" size={15} />
                </Link>
              )}
            </div>
            <p className="mt-0.5 truncate text-[0.6875rem] text-[#999999] lg:text-[0.8125rem]">{piece ? [piece.brand, piece.year].filter(Boolean).join(" · ") : " "}</p>
            <button
              onClick={() => setGallery({ start: index, origin: cf.current?.measureActiveCard() ?? null, scope: active })}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-th-chip px-[1.125rem] text-[0.8125rem] font-semibold hover:bg-th-chip-pressed"
            >
              <Icon name="expand" size={15} /> enter gallery
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-[1.375rem] px-3 pt-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:px-8 xl:grid-cols-5">
          {shown.map((p) => (
            <PieceCard key={p.id} href={`/pieces/${p.id}`} photo={p.photo} title={p.name ?? p.type} subtitle={p.brand} />
          ))}
        </div>
      )}

      {gallery && (
        <Gallery
          pieces={toGallery(shown)}
          startIndex={gallery.start}
          scopeLabel={activeName}
          origin={gallery.origin}
          scopes={[{ id: null, label: "whole vault" }, ...collections.map((c) => ({ id: c.id, label: c.name }))]}
          scopeId={gallery.scope}
          loadScope={async (id) => toGallery(id ? pieces.filter((p) => p.collectionIds.includes(id)) : pieces)}
          onClose={(end) => {
            setGallery(null);
            if (view.mode === "coverflow" && end !== index) cf.current?.flyTo(end, "step");
          }}
        />
      )}
    </div>
  );
}
