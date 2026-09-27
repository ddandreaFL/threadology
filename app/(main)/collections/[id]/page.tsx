import { notFound } from "next/navigation";
import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { OwnerCollectionView, type CollectionPiece } from "@/components/owner/OwnerCollectionView";

/** One of your collections — the app's collection screen. */
export default async function OwnerCollectionPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) notFound();

  const { data: collection } = await supabase
    .from("collections")
    .select("id, name, collection_pieces(pieces(id, name, type, brand, year, photos, created_at))")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!collection) notFound();

  type Row = { id: string; name: string | null; type: string; brand: string; year: string | null; photos: string[] | null; created_at: string };
  const pieces: CollectionPiece[] = ((collection.collection_pieces ?? []) as { pieces: Row | null }[])
    .map((cp) => cp.pieces)
    .filter((p): p is Row => !!p)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => ({ id: p.id, brand: p.brand, type: p.type, name: p.name, year: p.year, photo: p.photos?.[0] ?? null }));

  const share = await getShareState(supabase, "collection", collection.id);
  return <OwnerCollectionView id={collection.id} name={collection.name} username={profile.username} pieces={pieces} share={share} />;
}
