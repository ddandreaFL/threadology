"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { DetailChip, MoreMenu, type StripItem } from "@/components/detail/kit";
import { PieceDetail, type PieceDetailData } from "@/components/detail/PieceDetail";
import { deletePiece, setPiecePrivate } from "@/lib/actions/pieces";
import { addPieceToCollections } from "@/lib/actions/collections";
import type { ShareState } from "@/lib/share-state";

export type OwnerPieceDetail = PieceDetailData & { estimatedValue: number | null; is_private: boolean };

/**
 * One of your pieces — the app's piece screen (threadology-native/components/
 * detail/PieceBody.tsx). The page is PieceDetail; this holds its sheets:
 * share, collections, and the ··· menu's actions.
 */
export function OwnerPieceView({
  piece,
  username,
  collections,
  memberOf,
  wornIn,
  share,
}: {
  piece: OwnerPieceDetail;
  username: string;
  collections: { id: string; name: string }[];
  memberOf: string[];
  wornIn: StripItem[];
  share: ShareState;
}) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string[]>(memberOf);
  const [saving, setSaving] = useState(false);
  const title = piece.name ?? piece.type;

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

  async function togglePrivate() {
    const r = await setPiecePrivate(piece.id, !piece.is_private);
    if ("error" in r) return window.alert(r.error);
    router.refresh();
  }

  const chips = (glass: boolean) => (
    <>
      <DetailChip icon="chevron-left" label="Back" href="/vault" glass={glass} />
      <span className="flex gap-2">
        {/* A private piece is in no shared link, so there is nothing to share. */}
        {!piece.is_private && <DetailChip icon="share" label="Share" onClick={() => setSharing(true)} glass={glass} />}
        <MoreMenu
          glass={glass}
          items={[
            ...(piece.is_private ? [] : [{ label: "share", onClick: () => setSharing(true) }]),
            { label: "edit piece", href: `/pieces/${piece.id}/edit` },
            { label: piece.is_private ? "make visible in shares" : "make private", onClick: togglePrivate },
            { label: "delete piece", onClick: remove, danger: true },
          ]}
        />
      </span>
    </>
  );

  return (
    <>
      <PieceDetail
        piece={piece}
        owner
        estimatedValue={piece.estimatedValue}
        wornIn={wornIn}
        collections={collections.filter((c) => memberOf.includes(c.id)).map((c) => ({ ...c, href: `/collections/${c.id}` }))}
        chips={chips(true)}
        toolbar={chips(false)}
        onManageCollections={() => setPicking(true)}
      />

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
    </>
  );
}
