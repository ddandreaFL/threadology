import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { OwnerFits, type OwnerFit } from "@/components/owner/OwnerFits";

/** Your fits, newest first — the app's fits tab. */
export default async function FitsPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("fits")
    .select("id, title, photos, date, created_at, fit_pieces(piece_id)")
    .eq("user_id", user.id)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const fits: OwnerFit[] = (data ?? []).map((f) => ({
    id: f.id,
    title: f.title,
    photo: f.photos?.[0] ?? null,
    date: f.date,
    pieceCount: (f.fit_pieces ?? []).length,
  }));
  return <OwnerFits fits={fits} />;
}
