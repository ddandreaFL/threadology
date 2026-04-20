"use client";

import { useState, useMemo } from "react";
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
};

interface VaultClientProps {
  pieces: Piece[];
  basePath: string;
}

export function VaultClient({ pieces, basePath }: VaultClientProps) {
  const [query, setQuery] = useState("");

  const filteredPieces = useMemo(() => {
    if (!query.trim()) return pieces;
    const q = query.toLowerCase();
    return pieces.filter(
      (piece) =>
        piece.brand?.toLowerCase().includes(q) ||
        piece.name?.toLowerCase().includes(q) ||
        piece.type?.toLowerCase().includes(q)
    );
  }, [pieces, query]);

  return (
    <>
      <VaultSearch onSearch={setQuery} />

      {filteredPieces.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">
          No pieces match &ldquo;{query}&rdquo;
        </p>
      ) : (
        <VaultGrid pieces={filteredPieces} basePath={basePath} />
      )}
    </>
  );
}
