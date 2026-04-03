"use client";

import { useState } from "react";
import Link from "next/link";
import type { FitPiece } from "./piece-slot";

interface PieceSelectorProps {
  pieces: FitPiece[];
  selectedIds: Set<string>;
  onSelect: (piece: FitPiece) => void;
  onClose: () => void;
}

export function PieceSelector({
  pieces,
  selectedIds,
  onSelect,
  onClose,
}: PieceSelectorProps) {
  const [query, setQuery] = useState("");

  const filtered = pieces.filter((p) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.brand.toLowerCase().includes(q) ||
      p.type.toLowerCase().includes(q) ||
      (p.name?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-lg flex-col rounded-t-2xl bg-white sm:rounded-2xl"
        style={{ maxHeight: "85vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E0D8CC] px-5 py-4">
          <h2 className="text-lg text-gray-900">Select a piece</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by brand or name…"
              autoFocus
              className="w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] py-2 pl-9 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#2D5A45] focus:ring-2 focus:ring-[#2D5A45]/20"
            />
          </div>
        </div>

        {/* Piece grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-3">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">
              {query ? "No pieces match your search." : "No pieces in your vault yet."}
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {filtered.map((piece) => {
                const isSelected = selectedIds.has(piece.id);
                const label = piece.name ?? piece.type;
                const coverPhoto = piece.photos[0];
                const cropPos = piece.crop_positions?.["0"];
                const objectPosition = cropPos
                  ? `${cropPos.x}% ${cropPos.y}%`
                  : "50% 50%";

                return (
                  <button
                    key={piece.id}
                    type="button"
                    disabled={isSelected}
                    onClick={() => !isSelected && onSelect(piece)}
                    className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-[#2D5A45] opacity-50 cursor-default"
                        : "border-[#E0D8CC] hover:border-[#2D5A45]/50 hover:shadow-sm"
                    }`}
                  >
                    {/* Photo */}
                    <div className="aspect-square overflow-hidden bg-[#F5F1EA]">
                      {coverPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={coverPhoto}
                          alt={label}
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                          style={{ objectPosition }}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <svg className="h-6 w-6 text-[#C8BFB0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#2D5A45]">
                        <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    {/* Info */}
                    <div className="px-2 pb-2 pt-1.5">
                      <p className="truncate font-mono-display text-[9px] uppercase tracking-widest text-gray-400">
                        {piece.brand}
                      </p>
                      <p className="truncate text-xs capitalize text-gray-800">
                        {label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E0D8CC] px-5 py-3">
          <Link
            href="/vault/add"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 text-sm text-[#2D5A45] transition-colors hover:text-[#1E3D2F]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add a new piece to your vault
          </Link>
        </div>
      </div>
    </div>
  );
}
