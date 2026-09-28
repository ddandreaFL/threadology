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

  const [{ data: piece }, { data: priv }, { data: collections }, { data: memberships }, { data: worn }] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, season, size, condition, made_in, story, photos, is_private, created_at")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    supabase.from("piece_private").select("estimated_value").eq("piece_id", params.id).maybeSingle(),
    supabase.from("collections").select("id, name").eq("user_id", user.id).order("position"),
    supabase.from("collection_pieces").select("collection_id").eq("piece_id", params.id),
    // Worn in: the fits this piece is tagged in.
    supabase.from("fit_pieces").select("fits!inner(id, title, date, photos, user_id)").eq("piece_id", params.id).eq("fits.user_id", user.id),
  ]);
  if (!piece) notFound();
  const share = await getShareState(supabase, "piece", piece.id);

  type F = { id: string; title: string | null; date: string | null; photos: string[] | null };
  const wornIn = ((worn ?? []) as unknown as { fits: F | null }[])
    .map((r) => r.fits)
    .filter((f): f is F => !!f)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .map((f) => ({ id: f.id, title: f.title ?? "untitled fit", date: f.date, photo: f.photos?.[0] ?? null, href: `/fits/${f.id}` }));

  return (
    <OwnerPieceView
      piece={{
        ...piece,
        photos: piece.photos ?? [],
        added_on: piece.created_at?.slice(0, 10) ?? null,
        estimatedValue: priv?.estimated_value ?? null,
      }}
      username={profile.username}
      collections={collections ?? []}
      memberOf={(memberships ?? []).map((m) => m.collection_id)}
      wornIn={wornIn}
      share={share}
    />
  );
}
