import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import type { FitPieceOption } from "@/components/fit/FitEditor";

/** Your pieces, newest first, as the fit editor's picker lists them. */
export async function fitPieceOptions(supabase: SupabaseClient<Database>, userId: string): Promise<FitPieceOption[]> {
  const { data } = await supabase
    .from("pieces")
    .select("id, brand, type, name, photos")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []).map((p) => ({ id: p.id, brand: p.brand, type: p.type, name: p.name, photo: p.photos?.[0] ?? null }));
}
