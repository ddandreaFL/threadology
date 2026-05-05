"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { VaultGrid } from "./vault-grid";
import { CoverflowView } from "./coverflow-view";
import { AddPill } from "@/components/layout/AddPill";
import { useVaultUI } from "@/components/layout/VaultUIContext";

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
  isOwner?: boolean;
}

export function VaultClient({ pieces, collections, basePath, isOwner = false }: VaultClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { view, query, searchOpen } = useVaultUI();

  const initialSlug = searchParams.get("c") ?? null;
  const initialCollection = collections.find((c) => c.slug === initialSlug) ?? null;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(initialCollection);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const slug = searchParams.get("c") ?? null;
    setActiveCollection(collections.find((c) => c.slug === slug) ?? null);
  }, [searchParams, collections]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCollection, query]);

  const selectCollection = (collection: Collection | null) => {
    setActiveCollection(collection);
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

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, filteredPieces.length - 1));

  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const isViewingAll = !query.trim() && !activeCollection;
  const recentPieces = isViewingAll
    ? filteredPieces.filter((p) => Date.now() - new Date(p.created_at).getTime() < SEVEN_DAYS_MS)
    : [];
  const olderPieces = isViewingAll
    ? filteredPieces.filter((p) => Date.now() - new Date(p.created_at).getTime() >= SEVEN_DAYS_MS)
    : filteredPieces;

  return (
    <div className={`flex flex-col ${view === "coverflow" && !searchOpen ? "h-[calc(100dvh-144px)] max-h-[620px] overflow-hidden" : ""}`}>
      {/* Collection chips */}
      {collections.length > 0 && (
        <div className="flex overflow-x-auto gap-1.5 py-3 mb-1" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => selectCollection(null)}
            className={`shrink-0 rounded-[20px] px-3.5 py-[5px] text-[12px] font-medium transition-colors ${
              !activeCollection
                ? "bg-[#1A1A1A] text-white"
                : "border border-[#EBEBEB] text-[#999999]"
            }`}
          >
            all
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCollection(c)}
              className={`shrink-0 whitespace-nowrap rounded-[20px] px-3.5 py-[5px] text-[12px] font-medium transition-colors ${
                activeCollection?.id === c.id
                  ? "bg-[#1A1A1A] text-white"
                  : "border border-[#EBEBEB] text-[#999999]"
              }`}
            >
              {c.name.toLowerCase()}
            </button>
          ))}
        </div>
      )}

      <div className="h-px bg-[#EBEBEB] -mx-4" />

      {/* Content */}
      {filteredPieces.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-[#999999]">
          {query
            ? `no results for "${query}"`
            : activeCollection
            ? "this collection is empty"
            : "no pieces yet"}
        </p>
      ) : view === "coverflow" ? (
        <div className="flex-1 overflow-hidden">
          <CoverflowView
            pieces={filteredPieces}
            basePath={basePath}
            activeIndex={safeActiveIndex}
            onActiveChange={setActiveIndex}
          />
        </div>
      ) : (
        <div className="py-4">
          {recentPieces.length > 0 ? (
            <>
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[#999999]">
                Just Archived
              </p>
              <VaultGrid pieces={recentPieces} basePath={basePath} />
              {olderPieces.length > 0 && (
                <>
                  <div className="my-6 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#EBEBEB]" />
                    <span className="text-[11px] text-[#999999]">the rest</span>
                    <div className="h-px flex-1 bg-[#EBEBEB]" />
                  </div>
                  <VaultGrid pieces={olderPieces} basePath={basePath} />
                </>
              )}
            </>
          ) : (
            <VaultGrid pieces={olderPieces} basePath={basePath} />
          )}
        </div>
      )}

      {/* Floating add pill */}
      {isOwner && <AddPill />}
    </div>
  );
}
