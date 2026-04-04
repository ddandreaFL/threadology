import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { VaultGrid } from "@/components/vault/vault-grid";
import { EmptyVault } from "@/components/vault/empty-vault";

export default async function VaultPage() {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: pieces } = await supabase
    .from("pieces")
    .select("id, brand, type, name, year, photos, crop_positions")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allPieces = pieces ?? [];
  const pieceCount = allPieces.length;
  const brandCount = new Set(allPieces.map((p) => p.brand.toLowerCase())).size;

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl text-gray-900">Your Vault</h1>
        {pieceCount > 0 && (
          <div className="mt-1.5 flex items-center gap-4 text-sm text-gray-400">
            <span>
              {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
            </span>
            <span className="text-gray-200">·</span>
            <span>
              {brandCount} {brandCount === 1 ? "brand" : "brands"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {allPieces.length === 0 ? (
        <EmptyVault />
      ) : (
        <VaultGrid pieces={allPieces} />
      )}

      {/* Floating Add button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-40 px-4">
        <Link
          href="/vault/add"
          className="flex items-center gap-2 rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#1E3D2F] hover:shadow-xl active:scale-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add piece
        </Link>
      </div>
    </div>
  );
}
