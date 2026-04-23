import type { Database } from "@/types/supabase";

type Piece = Pick<Database["public"]["Tables"]["pieces"]["Row"], "brand" | "year">;

interface VaultStatsProps {
  pieces: Piece[];
}

function getEraSpan(pieces: Piece[]): string | null {
  const years = pieces.flatMap((p) => {
    if (!p.year) return [];
    const match = p.year.match(/\b(19|20)\d{2}\b/);
    return match ? [parseInt(match[0])] : [];
  });
  if (years.length < 2) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  if (min === max) return null;
  return `${min}–${max}`;
}

export function VaultStats({ pieces }: VaultStatsProps) {
  const pieceCount = pieces.length;
  const brandCount = new Set(pieces.map((p) => p.brand.toLowerCase())).size;
  const era = getEraSpan(pieces);

  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono-display text-xs uppercase tracking-widest text-gray-400">
      <span>
        {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
      </span>
      <span className="text-[#E0D8CC]">·</span>
      <span>
        {brandCount} {brandCount === 1 ? "brand" : "brands"}
      </span>
      {era && (
        <>
          <span className="text-[#E0D8CC]">·</span>
          <span>Spanning {era}</span>
        </>
      )}
    </div>
  );
}
