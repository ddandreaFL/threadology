import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { SavedShelf, type SavedRow } from "@/components/owner/SavedShelf";

export const metadata = { title: "saved · threadology" };

/** The shelf: links you were sent and kept. */
export default async function SavedPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("my_saves" as never);
  return <SavedShelf userId={user.id} initial={(Array.isArray(data) ? data : []) as SavedRow[]} />;
}
