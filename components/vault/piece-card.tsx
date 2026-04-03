import Link from "next/link";
import type { Database } from "@/types/database";

type Piece = Pick<
  Database["public"]["Tables"]["pieces"]["Row"],
  "id" | "brand" | "type" | "name" | "year" | "photos" | "crop_positions"
>;

interface PieceCardProps {
  piece: Piece;
}

export function PieceCard({ piece }: PieceCardProps) {
  const label = piece.name ?? piece.type;

  return (
    <Link
      href={`/vault/${piece.id}`}
      className="group block overflow-hidden rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      {/* Photo */}
      <div className="aspect-square overflow-hidden bg-[#F5F1EA]">
        {piece.photos[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={piece.photos[0]}
            alt={label}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            style={{
              objectPosition: piece.crop_positions?.["0"]
                ? `${piece.crop_positions["0"].x}% ${piece.crop_positions["0"].y}%`
                : "50% 50%",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg
              className="h-10 w-10 text-[#C8BFB0]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {/* simple shirt silhouette */}
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-3 pb-3 pt-2.5">
        <p className="truncate font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
          {piece.brand}
        </p>
        <p className="mt-0.5 truncate text-sm leading-snug text-gray-900 capitalize">
          {label}
        </p>
        {piece.year && (
          <p className="mt-0.5 text-xs text-gray-400">{piece.year}</p>
        )}
      </div>
    </Link>
  );
}
