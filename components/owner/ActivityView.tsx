"use client";

import { useState } from "react";
import { ChipButton } from "@/components/ui/ChipButton";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { ReactionsStat, SavedStat, SocialEmpty } from "@/components/profile/kit";
import { socialState, SOCIAL_EMPTY, type ProfileStats } from "@/lib/profile-stats";
import type { ShareState } from "@/lib/share-state";

/**
 * Activity — the app's (threadology-native/app/(main)/activity.tsx): what
 * other people did with what you shared. Reached from the profile's inbox;
 * friends will live here when they exist.
 */
export function ActivityView({ userId, stats, share }: { userId: string; stats: ProfileStats; share: ShareState }) {
  const [sharing, setSharing] = useState(false);
  const social = socialState(stats);
  return (
    <div className="font-th-sans">
      <header className="flex items-center px-5 pb-3.5 pt-[15px]">
        <ChipButton icon="chevron-left" label="back" href="/profile" />
        <h1 className="flex-1 text-center text-[17px] font-bold tracking-[-0.01em]">activity</h1>
        <span className="w-11" />
      </header>
      <div className="mx-auto flex max-w-xl flex-col gap-7 px-5 pb-10 pt-2 lg:max-w-4xl lg:flex-row lg:items-start lg:gap-10 lg:[&>*]:flex-1">
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
