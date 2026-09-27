import { notFound } from "next/navigation";
import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { OwnerFitView } from "@/components/owner/OwnerFitView";

/** One of your fits — the app's fit screen. */
export default async function OwnerFitPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) notFound();

  const { data: fit } = await supabase
    .from("fits")
    .select("id, title, caption, date, location, photos, fit_pieces(layer_order, pieces(id, name, type, brand, photos))")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!fit) notFound();

  const [{ data: counts }, { data: who }, share] = await Promise.all([
    supabase.rpc("fit_reactions_for_owner", { p_fit_id: fit.id }),
    supabase.rpc("fit_reactors_for_owner" as never, { p_fit_id: fit.id } as never),
    getShareState(supabase, "fit", fit.id),
  ]);

  type P = { id: string; name: string | null; type: string; brand: string; photos: string[] | null };
  const worn = ((fit.fit_pieces ?? []) as { layer_order: number; pieces: P | null }[])
    .sort((a, b) => a.layer_order - b.layer_order)
    .map((fp) => fp.pieces)
    .filter((p): p is P => !!p)
    .map((p) => ({ id: p.id, name: p.name, type: p.type, brand: p.brand, photo: p.photos?.[0] ?? null }));

  return (
    <OwnerFitView
      fit={{
        id: fit.id,
        title: fit.title,
        caption: fit.caption,
        date: fit.date,
        location: fit.location,
        photos: fit.photos ?? [],
        worn,
        reactions: (Array.isArray(counts) ? counts : []) as { emoji: string; count: number }[],
        reactors: (Array.isArray(who) ? who : []) as { emoji: string; username: string; created_at: string }[],
      }}
      username={profile.username}
      share={share}
    />
  );
}
