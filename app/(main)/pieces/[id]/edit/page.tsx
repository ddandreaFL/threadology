import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EditPieceForm } from "@/components/piece/EditPieceForm";

export const metadata = { title: "edit piece · threadology" };

export default async function EditPiecePage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = await createServerClient();
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

  return (
    <EditPieceForm
      piece={{ ...piece, photos: piece.photos ?? [], estimatedValue: priv?.estimated_value ?? null }}
      userId={user.id}
      collections={collections ?? []}
      memberOf={(memberships ?? []).map((m) => m.collection_id)}
    />
  );
}
