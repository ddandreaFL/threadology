import Link from "next/link";
import { Shirt } from "lucide-react";

export function EmptyVault() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-24 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#F5F1EA]">
        <Shirt className="h-7 w-7 text-[#C8BFB0]" strokeWidth={1.25} />
      </div>

      <p className="text-lg text-gray-700">Your vault is empty.</p>
      <p className="mt-1.5 text-sm text-gray-400">
        Start documenting your wardrobe.
      </p>

      <Link
        href="/vault/add"
        className="mt-6 rounded-lg bg-[#2D5A45] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
      >
        Add Your First Piece
      </Link>
    </div>
  );
}
