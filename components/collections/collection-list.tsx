"use client";

import { useState } from "react";
import Link from "next/link";
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

export function CollectionList({ collections, username }: CollectionListProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteCollection(id);
    setDeleting(null);
  };

  if (collections.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No collections yet. Create one above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {collections.map((c) => {
        const count = c.collection_pieces?.[0]?.count ?? 0;
        return (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-[#E0D8CC] bg-white px-4 py-3"
          >
            <div>
              <Link
                href={`/vault/${username}/c/${c.slug}`}
                className="text-sm font-medium text-gray-800 hover:text-[#2D5A45]"
              >
                {c.name}
              </Link>
              <p className="mt-0.5 font-mono-display text-[10px] text-gray-400">
                {count} {count === 1 ? "piece" : "pieces"}
                {c.description && ` · ${c.description}`}
              </p>
            </div>
            <button
              onClick={() => handleDelete(c.id)}
              disabled={deleting === c.id}
              className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
              {deleting === c.id ? "Deleting..." : "Delete"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
