import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { fetchProfileStats } from "@/lib/profile-stats";
import { ActivityView } from "@/components/owner/ActivityView";
import { fetchMyFriends } from "@/lib/friends";

export const metadata = { title: "activity · threadology" };
export const dynamic = "force-dynamic";

/** What other people did with what you shared — from the profile's inbox. */
export default async function ActivityPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [stats, share, friends] = await Promise.all([fetchProfileStats(supabase, user.id), getShareState(supabase, "vault", user.id), fetchMyFriends(supabase)]);
  if (!stats) redirect("/profile");
  return <ActivityView userId={user.id} stats={stats} share={share} friends={friends} />;
}
