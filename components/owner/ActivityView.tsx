"use client";

import { useState } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { NavGroup, NavRow, ReactionsStat, SavedStat, SectionHead, SocialEmpty } from "@/components/profile/kit";
import { PersonRow } from "@/components/friends/PersonRow";
import { RequestActions } from "@/components/friends/FriendButtons";
import { socialState, SOCIAL_EMPTY, type ProfileStats } from "@/lib/profile-stats";
import type { ShareState } from "@/lib/share-state";
import type { MyFriends } from "@/lib/friends";

/**
 * Activity — the app's (threadology-native/app/(main)/activity.tsx): your
 * friends (requests to answer, the list) and what other people did with what
 * you shared. Reached from the profile's inbox.
 */
export function ActivityView({ userId, stats, share, friends }: { userId: string; stats: ProfileStats; share: ShareState; friends: MyFriends }) {
  const [sharing, setSharing] = useState(false);
  const social = socialState(stats);
  return (
    <div className="font-th-sans">
      <ScreenHeader title="activity" back={{ href: "/profile" }} />
      <section className="th-page pb-7 pt-3">
        <SectionHead label="friends" meta={friends.incoming.length ? `${friends.incoming.length} waiting` : undefined} />
        {friends.incoming.length > 0 && (
          <ul className="mb-3 border-t border-th-border">
            {friends.incoming.map((p) => (
              <PersonRow key={p.username} person={p} sub="wants to be friends" trailing={<RequestActions username={p.username} />} />
            ))}
          </ul>
        )}
        <NavGroup>
          <NavRow
            icon="profile"
            title={friends.friends.length === 0 ? "no friends yet" : `${friends.friends.length} ${friends.friends.length === 1 ? "friend" : "friends"}`}
            sub={
              friends.friends.length === 0
                ? "tap an @name in reactions or saves to add someone"
                : friends.friends.slice(0, 3).map((f) => `@${f.username}`).join(", ")
            }
            href="/friends"
          />
        </NavGroup>
      </section>
      <div className="th-page flex flex-col gap-7 pb-10">
        {social === "active" ? (
          <>
            {stats.reactions.total > 0 && <ReactionsStat reactions={stats.reactions} />}
            {stats.saves.total > 0 && <SavedStat saves={stats.saves} />}
          </>
        ) : (
          <SocialEmpty {...SOCIAL_EMPTY[social]} onShare={SOCIAL_EMPTY[social].share ? () => setSharing(true) : undefined} />
        )}
      </div>
      <Sheet open={sharing} title="share vault" onClose={() => setSharing(false)}>
        <ShareControl type="vault" id={userId} username={stats.user.username} initial={share} />
      </Sheet>
    </div>
  );
}
