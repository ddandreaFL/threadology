"use client";

import { useState } from "react";
import { deleteCollection } from "@/lib/actions/collections";

interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  collection_pieces: { count: number }[];
}

interface CollectionListProps {
  collections: Collection[];
  username: string;
}

export function CollectionList({ collections }: CollectionListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteCollection(id);
    setDeleting(null);
  };

  if (collections.length === 0) {
    return (
      <p className="py-10 text-center text-[12px] text-[#999999]">
        group your pieces into collections
      </p>
    );
  }

  return (
    <div>
      {collections.map((c) => {
        const count = c.collection_pieces?.[0]?.count ?? 0;
        return (
          <div
            key={c.id}
            className="flex items-center justify-between border-b border-[#F0F0F0] px-0 py-4"
          >
            <div className="min-w-0">
              <p className="text-[14px] font-medium text-[#111111]">{c.name}</p>
              <p className="mt-0.5 text-[11px] text-[#999999]">
                {count} {count === 1 ? "piece" : "pieces"}
                {c.description && ` · ${c.description}`}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <svg className="h-4 w-4 text-[#999999]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deleting === c.id}
                className="text-[11px] text-[#999999] transition-colors hover:text-red-500 disabled:opacity-40"
              >
                {deleting === c.id ? "…" : "delete"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
