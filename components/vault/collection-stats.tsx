"use client";

import { useState } from "react";

type StatsPiece = {
  brand: string;
  year: string | null;
  type: string;
  estimated_value: number | null;
};

interface CollectionStatsProps {
  pieces: StatsPiece[];
}

export function CollectionStats({ pieces }: CollectionStatsProps) {
  const [expanded, setExpanded] = useState(false);

  if (pieces.length === 0) return null;

  // Brand counts
  const brandCounts = new Map<string, number>();
  for (const p of pieces) {
    const b = p.brand.toLowerCase();
    brandCounts.set(b, (brandCounts.get(b) ?? 0) + 1);
  }
  const brandCount = brandCounts.size;

  // Era span
  const numericYears = pieces.flatMap((p) => {
    if (!p.year) return [];
    const m = p.year.match(/\b(19|20)\d{2}\b/);
    return m ? [parseInt(m[0])] : [];
  });
  const era =
    numericYears.length >= 2
      ? `${Math.min(...numericYears)}–${Math.max(...numericYears)}`
      : null;

  // Top 3 brands
  const topBrands = Array.from(brandCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // Type breakdown
  const typeCounts = new Map<string, number>();
  for (const p of pieces) {
    typeCounts.set(p.type, (typeCounts.get(p.type) ?? 0) + 1);
  }
  const typeBreakdown = Array.from(typeCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );

  // Value
  const hasValues = pieces.some(
    (p) => p.estimated_value !== null && p.estimated_value > 0
  );
  const totalValue = pieces.reduce(
    (sum, p) => sum + (p.estimated_value ?? 0),
    0
  );

  return (
    <div>
      {/* Primary row */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono-display text-xs uppercase tracking-widest text-gray-400">
        <span>
          {pieces.length} {pieces.length === 1 ? "piece" : "pieces"}
        </span>
        <span className="text-[#E0D8CC]">·</span>
        <span>
          {brandCount} {brandCount === 1 ? "brand" : "brands"}
        </span>
        {era && (
          <>
            <span className="text-[#E0D8CC]">·</span>
            <span>{era}</span>
          </>
        )}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="normal-case text-[#2D5A45] transition-colors hover:text-[#1E3D2F]"
        >
          {expanded ? "less ↑" : "more ↓"}
        </button>
      </div>

      {/* Expandable detail */}
      {expanded && (
        <div className="mt-5 grid grid-cols-1 gap-6 rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] p-5 sm:grid-cols-3">
          {/* Top brands */}
          <div>
            <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
              Top brands
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {topBrands.map(([brand, count], i) => (
                <span key={brand}>
                  {i > 0 && <span className="text-gray-300">, </span>}
                  {brand.charAt(0).toUpperCase() + brand.slice(1)}{" "}
                  <span className="text-gray-400">({count})</span>
                </span>
              ))}
            </p>
          </div>

          {/* Type breakdown */}
          <div>
            <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
              Types
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {typeBreakdown.slice(0, 5).map(([type, count], i) => (
                <span key={type}>
                  {i > 0 && <span className="text-gray-300">, </span>}
                  {count} {type}
                  {count > 1 ? "s" : ""}
                </span>
              ))}
              {typeBreakdown.length > 5 && (
                <span className="text-gray-400">
                  {" "}
                  +{typeBreakdown.length - 5} more
                </span>
              )}
            </p>
          </div>

          {/* Est. value */}
          <div>
            <p className="font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
              Est. value
            </p>
            <p className="mt-2 text-sm text-gray-700">
              {hasValues ? (
                `$${totalValue.toLocaleString()}`
              ) : (
                <span className="italic text-gray-400">
                  Add values to see estimate
                </span>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
