import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { OwnerVault, type OwnerPiece } from "@/components/owner/OwnerVault";

/**
 * Your vault, signed in — the app's vault tab. One read for the pieces with
 * their collection memberships, one for the collections; everything the
 * chips and the gallery do afterwards is local, as in the app.
 */
export default async function VaultPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [piecesResult, collectionsResult] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, photos, created_at, collection_pieces(collection_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("collections").select("id, name").eq("user_id", user.id).order("position"),
  ]);

  const pieces: OwnerPiece[] = (piecesResult.data ?? []).map((p) => ({
    id: p.id,
    brand: p.brand,
    type: p.type,
    name: p.name,
    year: p.year,
    photo: p.photos?.[0] ?? null,
    collectionIds: ((p.collection_pieces ?? []) as { collection_id: string }[]).map((cp) => cp.collection_id),
  }));

  return <OwnerVault pieces={pieces} collections={(collectionsResult.data ?? []) as { id: string; name: string }[]} />;
}
