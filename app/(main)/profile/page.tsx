import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { fetchProfileStats } from "@/lib/profile-stats";
import { OwnerProfile } from "@/components/owner/OwnerProfile";

/** You — the app's profile tab. Everything on it comes from one call. */
export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [stats, share] = await Promise.all([fetchProfileStats(supabase, user.id), getShareState(supabase, "vault", user.id)]);
  if (!stats) redirect("/login");
  return <OwnerProfile userId={user.id} stats={stats} share={share} />;
}
