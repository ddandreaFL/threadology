"use client";

import { useState } from "react";
import { ChipButton } from "@/components/ui/ChipButton";
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
      <header className="flex items-center px-5 pb-3.5 pt-[15px]">
        <ChipButton icon="chevron-left" label="back" href="/profile" />
        <h1 className="flex-1 text-center text-[17px] font-bold tracking-[-0.01em]">activity</h1>
        <span className="w-11" />
      </header>
      <section className="mx-auto max-w-xl px-5 pb-7 pt-2 lg:max-w-4xl">
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
      <div className="mx-auto flex max-w-xl flex-col gap-7 px-5 pb-10 lg:max-w-4xl lg:flex-row lg:items-start lg:gap-10 lg:[&>*]:flex-1">
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
