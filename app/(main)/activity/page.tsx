import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { fetchProfileStats } from "@/lib/profile-stats";
import { ActivityView } from "@/components/owner/ActivityView";

export const metadata = { title: "activity · threadology" };

/** What other people did with what you shared — from the profile's inbox. */
export default async function ActivityPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [stats, share] = await Promise.all([fetchProfileStats(supabase, user.id), getShareState(supabase, "vault", user.id)]);
  if (!stats) redirect("/profile");
  return <ActivityView userId={user.id} stats={stats} share={share} />;
}
