import { PieceCard } from "@/components/vault/piece-card";
import type { Database } from "@/types/database";

type Piece = Pick<
  Database["public"]["Tables"]["pieces"]["Row"],
  "id" | "brand" | "type" | "name" | "year" | "photos" | "crop_positions"
>;

interface VaultGridProps {
  pieces: Piece[];
}

export function VaultGrid({ pieces }: VaultGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {pieces.map((piece) => (
        <PieceCard key={piece.id} piece={piece} />
      ))}
    </div>
  );
}
