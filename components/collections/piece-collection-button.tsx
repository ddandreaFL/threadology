"use client";

import { useState } from "react";
import { CollectionPicker } from "./collection-picker";

interface PieceCollectionButtonProps {
  pieceId: string;
  collections: { id: string; name: string }[];
}

export function PieceCollectionButton({ pieceId, collections }: PieceCollectionButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-[4px] border border-dashed border-[#2D5A45] px-[10px] py-[5px] text-[11px] text-[#2D5A45] transition-colors hover:bg-[#2D5A45]/5"
      >
        add +
      </button>

      {open && (
        <CollectionPicker
          pieceId={pieceId}
          collections={collections}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
