import type { Database } from "@/types/database";

export type FitPiece = Pick<
  Database["public"]["Tables"]["pieces"]["Row"],
  "id" | "brand" | "type" | "name" | "photos" | "crop_positions"
>;

interface PieceSlotProps {
  piece: FitPiece | null;
  onSelect: () => void;
  onRemove: () => void;
  isDragOver?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function PieceSlot({
  piece,
  onSelect,
  onRemove,
  isDragOver = false,
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: PieceSlotProps) {
  const label = piece?.name ?? piece?.type ?? "";
  const coverPhoto = piece?.photos[0];
  const cropPos = piece?.crop_positions?.["0"];
  const objectPosition = cropPos ? `${cropPos.x}% ${cropPos.y}%` : "50% 50%";

  if (!piece) {
    return (
      <div
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`transition-colors ${isDragOver ? "ring-2 ring-[#2D5A45]/40 rounded-xl" : ""}`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] px-4 py-3 text-left transition-colors hover:border-[#2D5A45]/40 hover:bg-[#F5F1EA]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#C8BFB0] bg-[#F5F1EA]">
            <svg className="h-4 w-4 text-[#C8BFB0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <span className="text-sm text-gray-400">Tap to add piece</span>
        </button>
      </div>
    );
  }

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`flex items-center gap-3 rounded-xl border bg-[#FDFCFA] px-4 py-3 transition-all ${
        isDragOver
          ? "border-[#2D5A45] ring-2 ring-[#2D5A45]/30 scale-[1.02]"
          : "border-[#E0D8CC]"
      } ${draggable ? "cursor-grab active:cursor-grabbing active:opacity-70" : ""}`}
    >
      {/* Thumbnail */}
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[#E0D8CC] bg-[#F5F1EA]">
        {coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverPhoto}
            alt={label}
            className="h-full w-full object-cover"
            style={{ objectPosition }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-5 w-5 text-[#C8BFB0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
          {piece.brand}
        </p>
        <p className="truncate text-sm capitalize text-gray-800">
          {label}
        </p>
      </div>

      {/* Drag handle + remove */}
      <div className="flex shrink-0 items-center gap-1">
        {draggable && (
          <svg className="h-4 w-4 text-[#C8BFB0]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
          </svg>
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove piece"
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition-colors hover:bg-red-50 hover:text-red-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
