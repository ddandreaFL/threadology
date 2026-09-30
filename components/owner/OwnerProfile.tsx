"use client";

import { useState } from "react";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Icon } from "@/components/ui/Icon";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { EmptyPrompt } from "@/components/detail/kit";
import {
  Avatar,
  IdentityHead,
  NavGroup,
  NavRow,
  RankList,
  SectionHead,
  Totals,
  TypeList,
} from "@/components/profile/kit";
import { activitySummary, describeLatest, socialState, type ProfileStats } from "@/lib/profile-stats";
import type { ShareState } from "@/lib/share-state";

/**
 * You — the app's profile tab, as "your collection, in numbers": who you
 * are, the totals, top brands, pieces by type, then the inbox and settings.
 * What other people did with what you shared lives in the inbox, under
 * activity (/activity).
 *
 * A phone gets the app's single column. A desktop gets a side column
 * (identity, totals, inbox, settings) beside the stats. One
 * set of elements serves both: the two columns are `contents` on a phone,
 * so their children fall into the page's own order.
 */
export function OwnerProfile({ userId, stats, share }: { userId: string; stats: ProfileStats; share: ShareState }) {
  const [sharing, setSharing] = useState(false);
  const openShare = () => setSharing(true);
  const { user, totals } = stats;
  const social = socialState(stats);
  const isNew = social === "new";

  const totalsRow = (
    <Totals
      items={[
        ["pieces", totals.pieces],
        ["fits", totals.fits],
        ["collections", totals.collections],
      ]}
    />
  );

  const inbox = (
    <section>
      <SectionHead label="inbox" />
      <NavGroup>
        {/* What other people did with what you shared — the room a friends
            list will move into. */}
        <NavRow icon="profile" title="activity" sub={activitySummary(stats)} href="/activity" />
        <NavRow icon="bookmark" title="saved" sub={`your shelf · ${stats.shelf_count} ${stats.shelf_count === 1 ? "item" : "items"}`} href="/saved" />
        <NavRow
          icon="bell"
          title="notifications"
          sub={describeLatest(stats.latest_notification, stats.unread_count)}
          badge={stats.unread_count > 0 ? `${stats.unread_count} new` : null}
          href="/notifications"
        />
      </NavGroup>
    </section>
  );

  const settings = (
    <section>
      <NavGroup>
        <NavRow icon="gear" title="settings" sub="account, sharing, legal" href="/settings" />
      </NavGroup>
    </section>
  );

  return (
    <div className="font-th-sans">
      <div className="lg:hidden">
        <ScreenHeader
          title="profile"
          actions={[
            { icon: "share", label: "share vault", onClick: openShare },
            { icon: "pencil", label: "edit profile", href: "/profile/edit" },
          ]}
        />
      </div>

      <div className="flex flex-col gap-7 px-5 pb-7 pt-3 lg:grid lg:grid-cols-[22.5rem_minmax(0,1fr)] lg:items-start lg:gap-16 lg:px-12 lg:pb-14 lg:pt-10">
        {/* Side column on a desktop; its parts join the page's order on a phone. */}
        <div className="contents lg:sticky lg:top-10 lg:flex lg:flex-col lg:gap-5">
          <div className="order-1 lg:hidden">
            <IdentityHead user={user} />
          </div>
          <div className="hidden lg:block">
            <Avatar src={user.avatar_url} username={user.username} size={96} />
            <p className="mt-4 truncate text-[1.375rem] font-bold leading-7 tracking-[-0.01em]">@{user.username}</p>
            <p className="th-label mt-1">collecting since {new Date(user.created_at).getFullYear()}</p>
            {user.bio && <p className="mt-3 text-[0.875rem] leading-5 text-th-muted [text-wrap:pretty]">{user.bio}</p>}
            <div className="mt-5 flex gap-2">
              <Link href="/profile/edit" className="inline-flex h-10 items-center gap-1.5 rounded-th-inline-chip bg-th-chip px-3.5 text-[0.875rem] font-medium hover:bg-th-chip-pressed">
                <Icon name="pencil" size={16} /> edit profile
              </Link>
              <button type="button" onClick={openShare} className="inline-flex h-10 items-center gap-1.5 rounded-th-inline-chip bg-th-chip px-3.5 text-[0.875rem] font-medium hover:bg-th-chip-pressed">
                <Icon name="share" size={16} /> share
              </button>
            </div>
          </div>
          {!isNew && <div className="order-2 lg:order-none">{totalsRow}</div>}
          <div className="order-7 lg:order-none">{inbox}</div>
          <div className="order-8 lg:order-none">{settings}</div>
        </div>

        {/* The stats: side by side on a desktop. */}
        <div className="contents lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-10 lg:gap-y-12">
          {isNew ? (
            <section className="order-2 lg:order-none lg:col-span-2">
              <SectionHead label="your collection" />
              <div className="rounded-th-card bg-th-surface p-5">
                <p className="text-[1.0625rem] font-bold leading-[1.375rem] tracking-[-0.01em]">Your numbers start with your first piece</p>
                <p className="mt-1.5 text-[0.875rem] leading-5 text-th-muted">Top brands, types and counts fill in as your vault grows.</p>
              </div>
              <div className="mt-3">
                <EmptyPrompt title="add your first piece" hint="photo, brand, type — the rest can wait" href="/vault/add" />
              </div>
            </section>
          ) : (
            <>
              <section className="order-3 lg:order-none">
                <SectionHead label="top brands" />
                <RankList rows={stats.brands} limit={5} />
              </section>
              <section className="order-4 lg:order-none">
                <SectionHead label="pieces by type" />
                <TypeList rows={stats.types} />
              </section>
            </>
          )}
        </div>
      </div>

      <Sheet open={sharing} title="share vault" onClose={() => setSharing(false)}>
        <ShareControl type="vault" id={userId} username={user.username} initial={share} />
      </Sheet>
    </div>
  );
}
