import { notFound } from "next/navigation";
import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { OwnerPieceView } from "@/components/owner/OwnerPieceView";

/** One of your pieces, signed in. RLS scopes the read to your own rows. */
export default async function PiecePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) notFound();

  const [{ data: piece }, { data: priv }, { data: collections }, { data: memberships }] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, season, size, condition, made_in, story, photos, is_private")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("piece_private").select("estimated_value").eq("piece_id", params.id).maybeSingle(),
    supabase.from("collections").select("id, name").eq("user_id", user.id).order("position"),
    supabase.from("collection_pieces").select("collection_id").eq("piece_id", params.id),
  ]);
  if (!piece) notFound();
  const share = await getShareState(supabase, "piece", piece.id);

  return (
    <OwnerPieceView
      piece={{ ...piece, photos: piece.photos ?? [], estimatedValue: priv?.estimated_value ?? null }}
      username={profile.username}
      collections={collections ?? []}
      memberOf={(memberships ?? []).map((m) => m.collection_id)}
      share={share}
    />
  );
}
