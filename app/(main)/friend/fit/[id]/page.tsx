import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { FitDetail } from "@/components/detail/FitDetail";
import { VisitorChips } from "@/components/detail/VisitorChips";
import type { Reaction } from "@/components/detail/Reactions";

export const dynamic = "force-dynamic";

type FriendFit = {
  owner: { username: string };
  viewer: { is_owner: boolean };
  fit: { id: string; title: string | null; caption: string | null; date: string | null; location: string | null; photos: string[] | null };
  reactions: Reaction[];
  pieces: { id: string; brand: string; type: string; name: string | null; year: string | null; size: string | null; photos: string[] | null; layer_order: number }[];
};

/** A friend's fit, through friend_fit(). A friend can react, through react_to_friend_fit(). */
export default async function FriendFitPage({ params }: { params: { id: string } }) {
  await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("friend_fit" as never, { p_id: params.id } as never);
  const d = data as unknown as FriendFit | null;
  if (!d) redirect("/profile");
  if (d.viewer.is_owner) redirect(`/fits/${params.id}`);

  return (
    <FitDetail
      fit={{ id: d.fit.id, title: d.fit.title, caption: d.fit.caption, date: d.fit.date, location: d.fit.location ?? null, photos: d.fit.photos ?? [] }}
      pieces={[...d.pieces]
        .sort((a, b) => a.layer_order - b.layer_order)
        .map((p) => ({ id: p.id, brand: p.brand, type: p.type, name: p.name, year: p.year, size: p.size, photo: p.photos?.[0] ?? null, href: `/friend/piece/${p.id}` }))}
      owner={false}
      byline={`@${d.owner.username}`}
      reactions={d.reactions ?? []}
      friendFitId={d.fit.id}
      signedIn
      chips={<VisitorChips glass />}
      toolbar={<VisitorChips glass={false} />}
    />
  );
}
