"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { PieceCard } from "@/components/ui/PieceCard";
import { Sheet } from "@/components/ui/Sheet";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";
import { Gallery } from "@/components/gallery/Gallery";
import { ShareControl } from "@/components/sharing/share-control";
import { deleteCollection, renameCollection } from "@/lib/actions/collections";
import { useViewMode } from "./useViewMode";
import { plural, withoutEmoji } from "@/lib/text";
import type { ShareState } from "@/lib/share-state";

export type CollectionPiece = { id: string; brand: string; type: string; name: string | null; year: string | null; photo: string | null };

/**
 * One of your collections — the app's collection screen: cover flow or a
 * two-column grid, the gallery scoped to it, and a menu for share, rename
 * and delete.
 */
export function OwnerCollectionView({
  id,
  name,
  username,
  pieces,
  share,
}: {
  id: string;
  name: string;
  username: string;
  pieces: CollectionPiece[];
  share: ShareState;
}) {
  const router = useRouter();
  const view = useViewMode("collection_view_mode", "grid");
  const [index, setIndex] = useState(0);
  const [menu, setMenu] = useState(false);
  const [sheet, setSheet] = useState<"share" | "rename" | null>(null);
  const [newName, setNewName] = useState(name);
  const [gallery, setGallery] = useState<{ start: number; origin: DOMRect | null } | null>(null);
  const cf = useRef<CoverflowHandle>(null);
  const active = pieces[index];

  async function remove() {
    setMenu(false);
    if (!window.confirm(`Delete "${name}"? The pieces stay in your vault.`)) return;
    await deleteCollection(id);
    router.push("/collections");
    router.refresh();
  }

  const menuButton = (
    <div className="relative">
      <button aria-label="collection options" onClick={() => setMenu((v) => !v)} className="flex h-11 w-11 items-center justify-center rounded-th-chip bg-th-chip hover:bg-th-chip-pressed">
        <Icon name="overflow" size={21} />
      </button>
      {menu && (
        <div className="absolute right-0 top-12 z-20 w-48 overflow-hidden rounded-th-chip border border-th-border bg-white py-1 shadow-lg">
          {pieces.length > 0 && (
            <button onClick={() => (setMenu(false), setGallery({ start: 0, origin: null }))} className="block w-full px-4 py-2.5 text-left text-[14px] hover:bg-th-surface">
              enter gallery
            </button>
          )}
          <button onClick={() => (setMenu(false), setSheet("share"))} className="block w-full px-4 py-2.5 text-left text-[14px] hover:bg-th-surface">
            share
          </button>
          <button onClick={() => (setMenu(false), setNewName(name), setSheet("rename"))} className="block w-full px-4 py-2.5 text-left text-[14px] hover:bg-th-surface">
            rename
          </button>
          <button onClick={remove} className="block w-full px-4 py-2.5 text-left text-[14px] text-th-danger hover:bg-th-surface">
            delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="font-th-sans">
      <ScreenHeader
        title={name.toLowerCase()}
        subtitle={plural(pieces.length, "piece")}
        back={{ href: "/collections" }}
        actions={pieces.length > 0 ? [view.action] : []}
        trailing={menuButton}
      />

      {pieces.length === 0 ? (
        <p className="px-10 py-24 text-center text-[14px] text-th-muted">Nothing in here yet. Add pieces from a piece&apos;s page.</p>
      ) : view.mode === "coverflow" ? (
        <div className="pt-4 lg:pt-8">
          <Coverflow
            ref={cf}
            items={pieces.map((p) => ({ id: p.id, photo: p.photo, alt: p.name ?? p.type }))}
            index={index}
            onIndexChange={setIndex}
            onCardClick={(i) => (i === index ? router.push(`/pieces/${pieces[i].id}`) : cf.current?.flyTo(i, "glide"))}
            maxCardWidth={400}
            hiddenIndex={gallery?.origin ? index : null}
          />
          <div className="mt-4 px-5 text-center">
            <p className="truncate text-[14px] font-semibold tracking-[-0.2px] lg:text-[17px]">{active ? active.name ?? active.type : " "}</p>
            <p className="mt-0.5 truncate text-[11px] text-[#999999] lg:text-[13px]">{active ? [active.brand, active.year].filter(Boolean).join(" · ") : " "}</p>
            <button
              onClick={() => setGallery({ start: index, origin: cf.current?.measureActiveCard() ?? null })}
              className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-th-chip px-[18px] text-[13px] font-semibold hover:bg-th-chip-pressed"
            >
              <Icon name="expand" size={15} /> enter gallery
            </button>
          </div>
        </div>
      ) : (
        // Two columns on a phone at every size, as the app keeps it; wider
        // on a desktop.
        <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] px-3 pt-2 lg:grid-cols-4 lg:gap-x-5 lg:px-8">
          {pieces.map((p) => (
            <PieceCard key={p.id} href={`/pieces/${p.id}`} photo={p.photo} title={p.name ?? p.type} subtitle={p.brand} />
          ))}
        </div>
      )}

      <Sheet open={sheet === "share"} title="share collection" onClose={() => setSheet(null)}>
        <ShareControl type="collection" id={id} username={username} initial={share} />
      </Sheet>
      <Sheet open={sheet === "rename"} title="rename collection" onClose={() => setSheet(null)}>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await renameCollection(id, newName);
            setSheet(null);
            router.refresh();
          }}
        >
          <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full border-b border-[#E8E8E8] bg-transparent pb-2 text-[16px] outline-none focus:border-th-ink" />
          <button disabled={!newName.trim()} className="mt-6 w-full rounded-th-pill bg-[#1A1A1A] py-3.5 text-[15px] font-medium text-white disabled:opacity-50">
            save
          </button>
        </form>
      </Sheet>

      {gallery && (
        <Gallery
          pieces={pieces.map((p) => ({ id: p.id, photo: p.photo, title: p.name ?? p.type, brand: p.brand, year: p.year }))}
          startIndex={gallery.start}
          scopeLabel={withoutEmoji(name)}
          origin={gallery.origin}
          onClose={(end) => {
            setGallery(null);
            if (view.mode === "coverflow" && end !== index) cf.current?.flyTo(end, "step");
          }}
        />
      )}
    </div>
  );
}
