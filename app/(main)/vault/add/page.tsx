import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { AddPieceFlow } from "@/components/piece/AddPieceFlow";

export const metadata = { title: "add piece · threadology" };

export default async function AddPiecePage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [{ data: brands }, { data: collections }] = await Promise.all([
    supabase.from("pieces").select("brand").eq("user_id", user.id),
    supabase.from("collections").select("id, name").eq("user_id", user.id).order("position"),
  ]);
  // The brands you use most, as the app offers them.
  const counts = new Map<string, number>();
  for (const { brand } of brands ?? []) {
    const b = (brand ?? "").trim();
    if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  const topBrands = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([b]) => b);

  return <AddPieceFlow userId={user.id} topBrands={topBrands} collections={collections ?? []} />;
}
