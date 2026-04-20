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
        className="rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-[#F5F1EA]"
      >
        Collections
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
