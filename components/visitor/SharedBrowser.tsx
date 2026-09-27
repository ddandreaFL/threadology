"use client";

import { useRef, useState, type ReactNode } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { PieceCard } from "@/components/ui/PieceCard";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";
import { Gallery } from "@/components/gallery/Gallery";
import { SaveButton } from "@/components/shared/save-button";
import { PieceSheet } from "./PieceSheet";
import type { SharedPiece } from "@/lib/shared";

/**
 * Someone else's pieces — a shared vault or collection — as the app shows
 * them: the header with the cover flow / grid toggle, the caption under the
 * centered card, save and enter-gallery beneath it. A tap opens the piece.
 * On a desktop the cover flow runs larger and the grid wider.
 */
export function SharedBrowser({
  title,
  subtitle,
  owner,
  pieces,
  save,
  galleryLabel,
  above,
  footer,
}: {
  title: string;
  subtitle: string;
  owner: string;
  pieces: SharedPiece[];
  save: { type: "vault" | "collection"; token: string; label: string };
  galleryLabel: string;
  /** Between the header and the pieces (a vault's segment chips). */
  above?: ReactNode;
  footer?: ReactNode;
}) {
  const [view, setView] = useState<"coverflow" | "grid">("coverflow");
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [gallery, setGallery] = useState<{ start: number; origin: DOMRect | null } | null>(null);
  const cf = useRef<CoverflowHandle>(null);
  const active = pieces[index];

  const openGallery = (start: number, fromCard: boolean) =>
    setGallery({ start, origin: fromCard && view === "coverflow" ? cf.current?.measureActiveCard() ?? null : null });

  const actions = (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <SaveButton containerType={save.type} token={save.token} label={save.label} />
      {pieces.length > 0 && (
        <button
          onClick={() => openGallery(view === "coverflow" ? index : 0, true)}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-th-chip px-[18px] text-[13px] font-semibold text-th-ink hover:bg-th-chip-pressed"
        >
          <Icon name="expand" size={15} /> enter gallery
        </button>
      )}
    </div>
  );

  return (
    <div>
      <ScreenHeader
        title={title}
        subtitle={subtitle}
        actions={
          pieces.length > 0
            ? [
                view === "coverflow"
                  ? { icon: "grid", label: "show grid", onClick: () => setView("grid") }
                  : { icon: "coverflow", label: "show cover flow", onClick: () => setView("coverflow") },
              ]
            : []
        }
      />
      {above}

      {pieces.length === 0 ? (
        <div className="flex flex-col items-center gap-5 py-24">
          <p className="text-[15px] text-th-muted">Nothing in here yet.</p>
          {actions}
        </div>
      ) : view === "coverflow" ? (
        <div className="pt-4 lg:pt-10">
          <Coverflow
            ref={cf}
            items={pieces.map((p) => ({ id: p.id, photo: p.photos?.[0] ?? null, alt: p.name ?? p.type }))}
            index={index}
            onIndexChange={setIndex}
            onCardClick={(i) => (i === index ? setOpen(i) : cf.current?.flyTo(i, "glide"))}
            widthShare={0.6}
            maxCardWidth={400}
            hiddenIndex={gallery ? index : null}
          />
          <div className="mt-4 px-5 text-center">
            <p className="truncate text-[14px] font-semibold tracking-[-0.2px] text-th-ink lg:text-[17px]">{active ? active.name ?? active.type : " "}</p>
            <p className="mt-0.5 truncate text-[11px] text-[#999999] lg:text-[13px]">{active ? [active.brand, active.year].filter(Boolean).join(" · ") : " "}</p>
            <div className="mt-5">{actions}</div>
          </div>
        </div>
      ) : (
        <div className="px-3 lg:px-8">
          <div className="mb-6 flex justify-center">{actions}</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 xl:grid-cols-5">
            {pieces.map((p, i) => (
              <button key={p.id} onClick={() => setOpen(i)} className="text-left">
                <PieceCard photo={p.photos?.[0] ?? null} title={p.name ?? p.type} subtitle={p.brand} />
              </button>
            ))}
          </div>
        </div>
      )}

      {footer}

      {open !== null && pieces[open] && (
        <PieceSheet
          piece={pieces[open]}
          owner={owner}
          onClose={() => setOpen(null)}
          onGallery={() => {
            const i = open;
            setOpen(null);
            openGallery(i, false);
          }}
        />
      )}

      {gallery && (
        <Gallery
          pieces={pieces.map((p) => ({ id: p.id, photo: p.photos?.[0] ?? null, title: p.name ?? p.type, brand: p.brand, year: p.year }))}
          startIndex={gallery.start}
          scopeLabel={galleryLabel}
          origin={gallery.origin}
          onClose={(end) => {
            setGallery(null);
            if (view === "coverflow" && end !== index) cf.current?.flyTo(end, "step");
          }}
        />
      )}
    </div>
  );
}
