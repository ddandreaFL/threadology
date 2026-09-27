import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { OwnerCollections, type OwnerCollectionCard } from "@/components/owner/OwnerCollections";

/** Your collections — the app's collections tab. */
export default async function CollectionsPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, collection_pieces(pieces(photos, created_at))")
    .eq("user_id", user.id)
    .order("position");

  const collections: OwnerCollectionCard[] = (data ?? []).map((c) => {
    const pieces = ((c.collection_pieces ?? []) as { pieces: { photos: string[] | null; created_at: string } | null }[])
      .map((cp) => cp.pieces)
      .filter((p): p is { photos: string[] | null; created_at: string } => !!p)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return { id: c.id, name: c.name, count: pieces.length, previews: pieces.map((p) => p.photos?.[0]).filter(Boolean).slice(0, 4) as string[] };
  });

  return (
    <Suspense>
      <OwnerCollections collections={collections} />
    </Suspense>
  );
}
