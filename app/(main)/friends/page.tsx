import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fetchMyFriends } from "@/lib/friends";
import { timeAgo } from "@/lib/profile-stats";
import { BackHeader } from "@/components/friends/BackHeader";
import { PersonRow } from "@/components/friends/PersonRow";
import { SectionHead } from "@/components/profile/kit";

export const metadata = { title: "friends · threadology" };
export const dynamic = "force-dynamic";

/** Your friends, and the requests you sent that are still waiting. */
export default async function FriendsPage() {
  await requireUser();
  const data = await fetchMyFriends(await createServerClient());
  return (
    <div className="font-th-sans">
      <BackHeader title="friends" fallback="/activity" />
      <div className="mx-auto flex max-w-xl flex-col gap-7 px-5 pb-10 pt-3">
        {data.friends.length === 0 && data.outgoing.length === 0 && (
          <p className="text-[14px] text-th-muted">No friends yet. Tap an @name in your reactions or saves to add someone.</p>
        )}
        {data.friends.length > 0 && (
          <section>
            <SectionHead label="friends" meta={String(data.friends.length)} />
            <ul className="border-t border-th-border">
              {data.friends.map((p) => (
                <PersonRow key={p.username} person={p} sub={p.since ? `friends · ${timeAgo(p.since)}` : undefined} />
              ))}
            </ul>
          </section>
        )}
        {data.outgoing.length > 0 && (
          <section>
            <SectionHead label="requested" />
            <ul className="border-t border-th-border">
              {data.outgoing.map((p) => (
                <PersonRow key={p.username} person={p} sub="waiting on them" />
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
