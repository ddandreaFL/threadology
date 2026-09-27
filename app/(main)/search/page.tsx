import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { OwnerSearch } from "@/components/owner/OwnerSearch";

/** Search across your pieces and fits. */
export default async function SearchPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [{ data: pieces }, { data: fits }] = await Promise.all([
    supabase.from("pieces").select("id, brand, type, name, year, photos").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("fits").select("id, title, photos").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);
  return (
    <OwnerSearch
      pieces={(pieces ?? []).map((p) => ({ id: p.id, brand: p.brand, type: p.type, name: p.name, year: p.year, photo: p.photos?.[0] ?? null }))}
      fits={(fits ?? []).map((f) => ({ id: f.id, title: f.title, photo: f.photos?.[0] ?? null }))}
    />
  );
}
