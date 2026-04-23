import Link from "next/link";
import Image from "next/image";
import type { Database } from "@/types/database";

type Piece = Pick<
  Database["public"]["Tables"]["pieces"]["Row"],
  "id" | "brand" | "type" | "name" | "year" | "photos" | "crop_positions"
>;

interface PieceCardProps {
  piece: Piece;
  basePath?: string;
}

export function PieceCard({ piece, basePath }: PieceCardProps) {
  const label = piece.name ?? piece.type;
  const href = basePath ? `${basePath}/${piece.id}` : `/vault/${piece.id}`;

  return (
    <Link href={href} className="group block">
      {/* Photo */}
      <div className="relative aspect-square overflow-hidden rounded-[6px] bg-[#F5F5F5]">
        {piece.photos[0] ? (
          <Image
            src={piece.photos[0]}
            alt={label}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            style={{
              objectPosition: piece.crop_positions?.["0"]
                ? `${piece.crop_positions["0"].x}% ${piece.crop_positions["0"].y}%`
                : "50% 50%",
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-8 w-8 text-[#CCCCCC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
            </svg>
          </div>
        )}

        {/* Year badge */}
        {piece.year && (
          <span
            className="absolute right-2 top-2 rounded-[3px] px-[6px] py-[2px] text-[9px] font-semibold text-[#111111]"
            style={{ backgroundColor: "rgba(255,255,255,0.88)", backdropFilter: "blur(4px)" }}
          >
            {piece.year}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="mt-2">
        <p className="truncate text-[13px] font-medium text-[#111111]">{label}</p>
        <div className="mt-0.5 flex items-center justify-between">
          <p className="truncate text-[11px] text-[#999999]">{piece.brand}</p>
          <span className="ml-2 flex-shrink-0 text-[11px] text-[#999999]">···</span>
        </div>
      </div>
    </Link>
  );
}
