import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { PieceDetail } from "@/components/detail/PieceDetail";
import { VisitorChips } from "@/components/detail/VisitorChips";

export const dynamic = "force-dynamic";

type FriendPiece = {
  owner: { username: string };
  viewer: { is_owner: boolean };
  piece: {
    id: string;
    brand: string;
    type: string;
    name: string | null;
    year: string | null;
    season: string | null;
    size: string | null;
    condition: string | null;
    made_in: string | null;
    story: string | null;
    photos: string[] | null;
    created_at: string;
  };
  worn_in: { id: string; title: string | null; date: string | null; photo: string | null }[];
  collections: { id: string; name: string }[];
};

/** A friend's piece, through friend_piece(): read-only, never private pieces, never price or value. */
export default async function FriendPiecePage({ params }: { params: { id: string } }) {
  await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("friend_piece" as never, { p_id: params.id } as never);
  const d = data as unknown as FriendPiece | null;
  if (!d) redirect("/profile");
  if (d.viewer.is_owner) redirect(`/pieces/${params.id}`);

  return (
    <PieceDetail
      piece={{ ...d.piece, photos: d.piece.photos ?? [], added_on: d.piece.created_at?.slice(0, 10) ?? null }}
      owner={false}
      byline={`@${d.owner.username}`}
      wornIn={d.worn_in.map((f) => ({ id: f.id, title: f.title ?? "untitled fit", date: f.date, photo: f.photo, href: `/friend/fit/${f.id}` }))}
      collections={d.collections.map((c) => ({ id: c.id, name: c.name, href: `/friend/collection/${c.id}` }))}
      chips={<VisitorChips glass />}
      toolbar={<VisitorChips glass={false} />}
    />
  );
}
