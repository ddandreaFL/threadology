"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { VaultSearch } from "./vault-search";
import { VaultGrid } from "./vault-grid";

type Piece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  photos: string[];
  crop_positions: Record<string, { x: number; y: number }> | null;
  estimated_value: number | null;
  created_at: string;
  updated_at: string;
  collectionIds: string[];
};

type Collection = {
  id: string;
  name: string;
  slug: string;
};

interface VaultClientProps {
  pieces: Piece[];
  collections: Collection[];
  basePath: string;
}

export function VaultClient({ pieces, collections, basePath }: VaultClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const initialSlug = searchParams.get("c") ?? null;
  const initialCollection = collections.find((c) => c.slug === initialSlug) ?? null;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(initialCollection);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const slug = searchParams.get("c") ?? null;
    setActiveCollection(collections.find((c) => c.slug === slug) ?? null);
  }, [searchParams, collections]);

  const selectCollection = (collection: Collection | null) => {
    setActiveCollection(collection);
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    if (collection) {
      params.set("c", collection.slug);
    } else {
      params.delete("c");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const filteredPieces = useMemo(() => {
    let result = pieces;

    if (activeCollection) {
      result = result.filter((p) => p.collectionIds.includes(activeCollection.id));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.brand?.toLowerCase().includes(q) ||
          p.name?.toLowerCase().includes(q) ||
          p.type?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [pieces, activeCollection, query]);

  return (
    <>
      {/* Collection tabs */}
      {collections.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => selectCollection(null)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm transition-colors ${
              !activeCollection
                ? "bg-[#2D5A45] text-white"
                : "border border-[#E0D8CC] text-gray-600 hover:border-[#2D5A45] hover:text-[#2D5A45]"
            }`}
          >
            All
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCollection(c)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1 text-sm transition-colors ${
                activeCollection?.id === c.id
                  ? "bg-[#2D5A45] text-white"
                  : "border border-[#E0D8CC] text-gray-600 hover:border-[#2D5A45] hover:text-[#2D5A45]"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <VaultSearch onSearch={setQuery} />

      {filteredPieces.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          {query
            ? `No pieces match "${query}"`
            : activeCollection
            ? `No pieces in ${activeCollection.name} yet.`
            : "No pieces found."}
        </p>
      ) : (
        <VaultGrid pieces={filteredPieces} basePath={basePath} />
      )}
    </>
  );
}
