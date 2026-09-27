"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipButton } from "@/components/ui/ChipButton";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { deletePiece } from "@/lib/actions/pieces";
import { addPieceToCollections } from "@/lib/actions/collections";
import type { ShareState } from "@/lib/share-state";

export type OwnerPieceDetail = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  season: string | null;
  size: string | null;
  condition: string | null;
  made_in: string | null;
  story: string | null;
  photos: string[];
  estimatedValue: number | null;
  is_private: boolean;
};

/**
 * One of your pieces — the app's piece screen (threadology-native/app/
 * (main)/vault/[id].tsx): the photo edge to edge with floating chips, then
 * the record — brand line, name, type, the details as pills, collections,
 * the story. Estimated value is yours alone and appears only here. On a
 * desktop, photos left and the record right.
 */
export function OwnerPieceView({
  piece,
  username,
  collections,
  memberOf,
  share,
}: {
  piece: OwnerPieceDetail;
  username: string;
  collections: { id: string; name: string }[];
  memberOf: string[];
  share: ShareState;
}) {
  const router = useRouter();
  const [photo, setPhoto] = useState(0);
  const [sharing, setSharing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string[]>(memberOf);
  const [saving, setSaving] = useState(false);
  const title = piece.name ?? piece.type;

  const pills = (
    [
      ["COND", piece.condition],
      ["YEAR", piece.year],
      ["SEASON", piece.season],
      ["SIZE", piece.size],
      ["MADE IN", piece.made_in],
    ] as [string, string | null][]
  ).filter(([, v]) => !!v) as [string, string][];

  async function saveCollections() {
    setSaving(true);
    await addPieceToCollections(piece.id, selected);
    setSaving(false);
    setPicking(false);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    await deletePiece(piece.id);
    router.push("/vault");
    router.refresh();
  }

  const chips = (
    <>
      <ChipButton icon="share" label="share" onClick={() => setSharing(true)} onMedia />
      <ChipButton icon="pencil" label="edit piece" href={`/pieces/${piece.id}/edit`} onMedia />
    </>
  );

  return (
    <div className="font-th-sans lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:pt-8">
      {/* Photos */}
      <div className="relative lg:sticky lg:top-8 lg:self-start">
        <div className="aspect-[4/5] w-full overflow-hidden bg-th-chip lg:rounded-[24px]">
          {piece.photos[photo] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={piece.photos[photo]} alt={title} className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="absolute left-5 right-5 top-[calc(env(safe-area-inset-top)+12px)] flex justify-between lg:hidden">
          <ChipButton icon="chevron-left" label="back" href="/vault" onMedia />
          <span className="flex gap-2">{chips}</span>
        </div>
        {piece.photos.length > 1 && (
          <div className="mt-3 flex justify-center gap-2 lg:justify-start">
            {piece.photos.map((src, i) => (
              <button key={src} onClick={() => setPhoto(i)} aria-label={`photo ${i + 1}`} className={`h-14 w-14 overflow-hidden rounded-xl border-2 ${i === photo ? "border-th-ink" : "border-transparent"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* The record */}
      <div className="px-5 pb-10 pt-6 lg:px-0 lg:pt-0">
        <div className="mb-6 hidden items-center justify-between lg:flex">
          <ChipButton icon="chevron-left" label="back" href="/vault" />
          <span className="flex gap-2">{chips}</span>
        </div>
        <p className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">
          {piece.brand}
          {piece.is_private && <span className="ml-2 rounded-full bg-th-chip px-2 py-0.5 normal-case tracking-normal">private · not in shared links</span>}
        </p>
        <h1 className="mt-2 text-[28px] font-bold leading-8 tracking-[-0.02em] lg:text-[34px] lg:leading-[38px]">{title}</h1>
        {piece.name && <p className="mt-1.5 font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">{piece.type}</p>}

        {(pills.length > 0 || piece.estimatedValue != null) && (
          <section className="mt-7">
            <h2 className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">details</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {pills.map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1.5 rounded-full border border-th-border bg-[#FAFAFA] px-3 py-1.5">
                  <span className="font-th-mono text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB]">{k}</span>
                  <span className="text-[12px] font-semibold capitalize">{v}</span>
                </span>
              ))}
              {piece.estimatedValue != null && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#E4D9B8] bg-[#FDFAF0] px-3 py-1.5">
                  <span className="font-th-mono text-[9px] uppercase tracking-[0.1em] text-[#BBBBBB]">EST.</span>
                  <span className="text-[12px] font-semibold">${piece.estimatedValue.toLocaleString()}</span>
                </span>
              )}
            </div>
          </section>
        )}

        <section className="mt-7">
          <h2 className="font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">collections</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {collections
              .filter((c) => memberOf.includes(c.id))
              .map((c) => (
                <a key={c.id} href={`/collections/${c.id}`} className="rounded-full bg-th-chip px-3.5 py-1.5 text-[13px] hover:bg-th-chip-pressed">
                  {c.name}
                </a>
              ))}
            <button onClick={() => setPicking(true)} className="rounded-full border border-dashed border-th-border px-3.5 py-1.5 text-[13px] text-th-muted hover:text-th-ink">
              add +
            </button>
          </div>
        </section>

        {piece.story && (
          <section className="mt-8 border-l-2 border-th-accent pl-5">
            {piece.story.split("\n\n").map((para, i) => (
              <p key={i} className="mb-3 text-[15px] leading-relaxed">
                {para}
              </p>
            ))}
          </section>
        )}

        <button onClick={remove} className="mt-12 text-[12px] text-[#999999] transition-colors hover:text-th-danger">
          delete piece
        </button>
      </div>

      <Sheet open={sharing} title="share" onClose={() => setSharing(false)}>
        <ShareControl type="piece" id={piece.id} username={username} initial={share} />
      </Sheet>

      <Sheet open={picking} title="collections" onClose={() => setPicking(false)}>
        {collections.length === 0 ? (
          <p className="text-[14px] text-th-muted">No collections yet — make one from the collections tab.</p>
        ) : (
          <div className="flex flex-col">
            {collections.map((c) => {
              const on = selected.includes(c.id);
              return (
                <label key={c.id} className="flex cursor-pointer items-center justify-between border-b border-th-border py-3.5 text-[15px]">
                  {c.name}
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setSelected((s) => (on ? s.filter((x) => x !== c.id) : [...s, c.id]))}
                    className="h-5 w-5 accent-[#2D5A45]"
                  />
                </label>
              );
            })}
            <button onClick={saveCollections} disabled={saving} className="mt-5 rounded-th-pill bg-[#1A1A1A] py-3 text-[15px] font-medium text-white disabled:opacity-60">
              {saving ? "saving…" : "save"}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}
