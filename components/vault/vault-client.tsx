"use client";

import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { VaultSearch } from "./vault-search";
import { VaultGrid } from "./vault-grid";
import { CoverflowView } from "./coverflow-view";

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

type ViewMode = "coverflow" | "grid";

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

  const initialSlug = searchParams.get("c") ?? null;
  const initialCollection = collections.find((c) => c.slug === initialSlug) ?? null;

  const [activeCollection, setActiveCollection] = useState<Collection | null>(initialCollection);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("coverflow");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("vault-view") as ViewMode | null;
    if (saved === "coverflow" || saved === "grid") setView(saved);
  }, []);

  useEffect(() => {
    const slug = searchParams.get("c") ?? null;
    setActiveCollection(collections.find((c) => c.slug === slug) ?? null);
  }, [searchParams, collections]);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeCollection, query]);

  const toggleView = (v: ViewMode) => {
    setView(v);
    localStorage.setItem("vault-view", v);
  };

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

  const safeActiveIndex = Math.min(activeIndex, Math.max(0, filteredPieces.length - 1));

  return (
    <div className={`flex flex-col ${view === "coverflow" && !searchOpen ? "h-[calc(100dvh-144px)] max-h-[620px] overflow-hidden" : ""}`}>
      {/* Tabs + view toggle row */}
      <div className="flex items-end justify-between border-b border-[#EBEBEB]">
        {/* Collection tabs */}
        <div className="flex overflow-x-auto gap-5" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => selectCollection(null)}
            className={`shrink-0 pb-3 text-[14px] transition-colors border-b-2 -mb-px ${
              !activeCollection
                ? "font-medium text-[#111111] border-[#111111]"
                : "font-normal text-[#999999] border-transparent"
            }`}
          >
            all
          </button>
          {collections.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCollection(c)}
              className={`shrink-0 whitespace-nowrap pb-3 text-[14px] transition-colors border-b-2 -mb-px ${
                activeCollection?.id === c.id
                  ? "font-medium text-[#111111] border-[#111111]"
                  : "font-normal text-[#999999] border-transparent"
              }`}
            >
              {c.name.toLowerCase()}
            </button>
          ))}
        </div>

        {/* View toggle + search */}
        <div className="flex items-center gap-4 pb-3 ml-4 shrink-0">
          {/* Search */}
          <button
            onClick={() => { setSearchOpen((o) => !o); if (searchOpen) setQuery(""); }}
            className={`transition-colors ${searchOpen ? "text-[#111111]" : "text-[#999999] hover:text-[#111111]"}`}
            aria-label="Search"
          >
            <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
          </button>

          {/* Coverflow icon */}
          <button
            onClick={() => toggleView("coverflow")}
            className="transition-opacity"
            style={{ opacity: view === "coverflow" ? 1 : 0.35 }}
            aria-label="Coverflow view"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <rect x="9" y="4" width="6" height="16" rx="1.5" />
              <rect x="1" y="7" width="5" height="10" rx="1" opacity="0.5" transform="skewY(-8)" />
              <rect x="18" y="7" width="5" height="10" rx="1" opacity="0.5" transform="skewY(8)" />
            </svg>
          </button>

          {/* Grid icon */}
          <button
            onClick={() => toggleView("grid")}
            className="transition-opacity"
            style={{ opacity: view === "grid" ? 1 : 0.35 }}
            aria-label="Grid view"
          >
            <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor">
              <rect x="3" y="3" width="8" height="8" rx="1.5" />
              <rect x="13" y="3" width="8" height="8" rx="1.5" />
              <rect x="3" y="13" width="8" height="8" rx="1.5" />
              <rect x="13" y="13" width="8" height="8" rx="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="border-b border-[#EBEBEB] py-2">
          <VaultSearch onSearch={setQuery} />
        </div>
      )}

      {/* Content */}
      {filteredPieces.length === 0 ? (
        <p className="py-16 text-center text-[13px] text-[#999999]">
          {query
            ? `no pieces match "${query}"`
            : activeCollection
            ? `no pieces in ${activeCollection.name} yet`
            : "no pieces found"}
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
          <VaultGrid pieces={filteredPieces} basePath={basePath} />
        </div>
      )}

      {/* Floating "add +" pill */}
      {isOwner && (
        <Link
          href="/vault/add"
          className="fixed bottom-6 left-1/2 flex h-14 -translate-x-1/2 items-center whitespace-nowrap rounded-[30px] bg-[#1A1A1A] px-9 text-[15px] font-medium text-white transition-opacity hover:opacity-80"
          style={{ boxShadow: "0 4px 16px rgba(45,90,69,0.30)" }}
        >
          add +
        </Link>
      )}
    </div>
  );
}
