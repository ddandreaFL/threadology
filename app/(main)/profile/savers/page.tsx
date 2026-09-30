import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fetchProfileStats, timeAgo } from "@/lib/profile-stats";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PersonRow } from "@/components/friends/PersonRow";

export const metadata = { title: "saved by · threadology" };

/**
 * Everyone who saved something of yours, newest first. Built as a plain
 * list of people so it can become the friends list without a redesign.
 */
export default async function SaversPage() {
  const user = await requireUser();
  const stats = await fetchProfileStats(await createServerClient(), user.id);
  if (!stats) redirect("/profile");
  const { savers, saver_count } = stats.saves;
  return (
    <div className="font-th-sans">
      <ScreenHeader title="saved by" subtitle={`${saver_count} ${saver_count === 1 ? "person" : "people"}`} back={{ href: "/activity" }} />
      <div className="th-page pb-10 pt-3">
        <ul className="border-t border-th-border">
          {savers.map((s) => (
            <PersonRow key={s.username} person={s} sub={`saved ${s.count} ${s.count === 1 ? "thing" : "things"} · ${timeAgo(s.latest_at)}`} />
          ))}
        </ul>
      </div>
    </div>
  );
}
