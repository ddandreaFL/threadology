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
    .select("id, brand, type, name, year, photos")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allPieces = pieces ?? [];
  const pieceCount = allPieces.length;
  const brandCount = new Set(allPieces.map((p) => p.brand.toLowerCase())).size;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-gray-900">Your Vault</h1>
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

        <Link
          href="/vault/add"
          className="shrink-0 rounded-lg bg-[#2D5A45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
        >
          + Add piece
        </Link>
      </div>

      {/* Content */}
      {allPieces.length === 0 ? (
        <EmptyVault />
      ) : (
        <VaultGrid pieces={allPieces} />
      )}
    </div>
  );
}
