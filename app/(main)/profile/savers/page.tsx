import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fetchProfileStats, timeAgo } from "@/lib/profile-stats";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Avatar } from "@/components/profile/kit";

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
      <ul className="mx-auto max-w-xl border-t border-th-border px-5 pb-10 lg:mt-3">
        {savers.map((s) => (
          <li key={s.username} className="flex min-h-16 items-center gap-3.5 border-b border-th-border py-3">
            <Avatar src={s.avatar_url} username={s.username} size={40} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[16px] font-medium leading-[21px]">@{s.username}</span>
              <span className="block text-[13px] leading-[17px] text-th-muted">
                saved {s.count} {s.count === 1 ? "thing" : "things"} · {timeAgo(s.latest_at)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
