import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { SharedBrowser } from "@/components/visitor/SharedBrowser";
import type { SharedPiece } from "@/lib/shared";

export const dynamic = "force-dynamic";

/** A friend's collection, through friend_collection() — the same browser as a shared one, without save. */
export default async function FriendCollectionPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("friend_collection" as never, { p_id: params.id } as never);
  const d = data as unknown as { owner: { username: string }; collection: { id: string; name: string }; pieces: SharedPiece[] } | null;
  if (!d) redirect("/profile");
  const { data: mine } = await supabase.from("collections").select("id").eq("id", params.id).eq("user_id", user.id).maybeSingle();
  if (mine) redirect(`/collections/${params.id}`);

  const pieces = (d.pieces ?? []).map((p) => ({ ...p, photos: p.photos ?? [] }));
  return (
    <SharedBrowser
      title={d.collection.name}
      subtitle={`@${d.owner.username} · ${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"}`}
      owner={d.owner.username}
      pieces={pieces}
      galleryLabel={`@${d.owner.username} · ${d.collection.name}`}
    />
  );
}
