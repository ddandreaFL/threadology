"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { LinkedRow, RowList } from "@/components/detail/kit";
import {
  allEqual,
  emojiLine,
  KIND_LABEL,
  saverNames,
  shortDate,
  timeAgo,
  type BrandCount,
  type ProfileStats,
  type TypeCount,
} from "@/lib/profile-stats";

/**
 * The profile's parts (the profile overhaul handoff, 9-29): the same pieces
 * as the app's components/profile/, drawn with the th- tokens.
 */

const num = "font-th-label font-light tabular-nums";

export function SectionHead({ label, meta, action }: { label: string; meta?: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="th-label">{label}</h2>
      {action ? (
        <Link href={action.href} className="text-[0.8125rem] font-medium leading-[1.0625rem] text-th-accent hover:underline">
          {action.label}
        </Link>
      ) : meta ? (
        <span className="th-label">{meta}</span>
      ) : null}
    </div>
  );
}

export function Avatar({ src, username, size }: { src: string | null; username: string; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-th-chip font-th-label font-light text-th-muted"
      style={{ width: `${size / 16}rem`, height: `${size / 16}rem`, fontSize: `${(size * 0.4) / 16}rem` }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" style={{ objectPosition: "50% 20%" }} />
      ) : (
        username[0]?.toUpperCase()
      )}
    </span>
  );
}

export function IdentityHead({ user, size = 72 }: { user: ProfileStats["user"]; size?: number }) {
  return (
    <section>
      <div className="flex items-center gap-4">
        <Avatar src={user.avatar_url} username={user.username} size={size} />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-[1.0625rem] font-bold leading-[1.375rem] tracking-[-0.01em]">@{user.username}</p>
          <p className="th-label">collecting since {new Date(user.created_at).getFullYear()}</p>
        </div>
      </div>
      {user.bio && <p className="mt-3.5 text-[0.875rem] leading-5 text-th-muted [text-wrap:pretty]">{user.bio}</p>}
    </section>
  );
}

/** Three in a row, or four as a 2×2. */
export function Totals({ items }: { items: [string, number][] }) {
  const four = items.length > 3;
  return (
    <div className={`grid border-y border-th-border ${four ? "grid-cols-2" : "grid-flow-col auto-cols-fr"}`}>
      {items.map(([label, value], i) => {
        const first = four ? i % 2 === 0 : i === 0;
        return (
          <div
            key={label}
            className={`flex flex-col gap-0.5 py-3 ${first ? "" : "border-l border-th-border pl-4"} ${four && i >= 2 ? "border-t border-th-border" : ""}`}
          >
            <span className={`${num} text-[1.75rem] leading-8 tracking-[-0.02em]`}>{value}</span>
            <span className="th-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Bar({ value, max }: { value: number; max: number }) {
  return (
    <div className="mt-2 h-1 bg-th-border">
      <div className="h-full min-w-1 bg-th-accent" style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

/**
 * Brands, ranked. When every brand has the same count the ranking means
 * nothing: no numbers, no bars, alphabetical, and a line saying so.
 */
export function RankList({ rows, limit, total }: { rows: BrandCount[]; limit?: number; total?: number }) {
  const flat = allEqual(rows);
  const ordered = flat ? [...rows].sort((a, b) => a.brand.localeCompare(b.brand, undefined, { sensitivity: "base" })) : rows;
  const shown = limit ? ordered.slice(0, limit) : ordered;
  const max = Math.max(1, ...rows.map((r) => r.count));
  const more = (total ?? rows.length) - shown.length;
  return (
    <>
      {flat && (
        <p className="-mt-1 mb-3 text-[0.8125rem] leading-[1.0625rem] text-th-muted">
          {rows.length} brands, {rows[0].count} {rows[0].count === 1 ? "piece" : "pieces"} each
        </p>
      )}
      <div className="border-t border-th-border">
        {shown.map((r, i) => (
          <div key={r.brand} className="flex min-h-14 items-center gap-3.5 border-b border-th-border py-3">
            {!flat && <span className="th-label w-[1.125rem] shrink-0">{String(i + 1).padStart(2, "0")}</span>}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[1rem] font-medium leading-[1.3125rem]">{r.brand}</span>
                <span className={`${num} shrink-0 text-[1rem] leading-[1.3125rem]`}>{r.count}</span>
              </div>
              {!flat && <Bar value={r.count} max={max} />}
            </div>
          </div>
        ))}
      </div>
      {limit && more > 0 && (
        <div className="flex items-center justify-between pt-3">
          <span className="text-[0.8125rem] leading-[1.0625rem] text-th-muted">
            and {more} more {more === 1 ? "brand" : "brands"}
          </span>
          <Link href="/profile/brands" className="text-[0.8125rem] font-medium leading-[1.0625rem] text-th-accent hover:underline">
            see all
          </Link>
        </div>
      )}
    </>
  );
}

/** Pieces by type; a category opens to its subtypes. One open at a time. */
export function TypeList({ rows }: { rows: TypeCount[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="border-t border-th-border">
      {rows.map((r) => {
        const expandable = r.subtypes.length > 0;
        const isOpen = open === r.type && expandable;
        const head = (
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-left text-[1rem] font-medium leading-[1.3125rem]">{r.type}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className={`${num} text-[1rem] leading-[1.3125rem]`}>{r.count}</span>
                {expandable && (
                  <span className={`flex text-th-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    <Icon name="chevron-down" size={14} strokeWidth={2} />
                  </span>
                )}
              </span>
            </div>
            <Bar value={r.count} max={max} />
          </div>
        );
        return (
          <div key={r.type}>
            {expandable ? (
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : r.type)}
                aria-expanded={isOpen}
                className="flex min-h-14 w-full items-center border-b border-th-border py-3 hover:bg-th-surface"
              >
                {head}
              </button>
            ) : (
              <div className="flex min-h-14 items-center border-b border-th-border py-3">{head}</div>
            )}
            {isOpen && (
              <div className="border-b border-th-border pb-2 pl-4 pt-1">
                {r.subtypes.map((s) => (
                  <div key={s.subtype} className="flex justify-between py-1.5 pr-[1.375rem] text-[0.875rem] leading-[1.1875rem] text-th-muted">
                    <span className="truncate">{s.subtype}</span>
                    <span className={`${num} text-[0.875rem]`}>{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ReactionsStat({ reactions }: { reactions: ProfileStats["reactions"] }) {
  const top = reactions.most_reacted_fit;
  return (
    <section>
      <SectionHead label="reactions" meta={`${reactions.total} on ${reactions.fit_count} ${reactions.fit_count === 1 ? "fit" : "fits"}`} />
      <div className="flex flex-wrap gap-2">
        {reactions.by_emoji.map((e) => (
          <span key={e.emoji} className="inline-flex h-11 min-w-16 items-center justify-center gap-2 rounded-th-chip bg-th-chip px-3.5">
            <span className="text-[1.125rem]">{e.emoji}</span>
            <span className="text-[1rem] font-medium tabular-nums">{e.count}</span>
          </span>
        ))}
      </div>
      {top && (
        <>
          <p className="th-label mb-2 mt-5">most reacted</p>
          <RowList>
            <LinkedRow
              photo={top.photo}
              title={top.title ?? "untitled fit"}
              sub={[emojiLine(top.by_emoji), shortDate(top.date)].filter(Boolean).join(" · ")}
              href={`/fits/${top.id}`}
            />
          </RowList>
        </>
      )}
    </section>
  );
}

const SAVED_HREF = {
  vault: () => "/vault",
  collection: (id: string) => `/collections/${id}`,
  fit: (id: string) => `/fits/${id}`,
  piece: (id: string) => `/pieces/${id}`,
};

export function SavedStat({ saves }: { saves: ProfileStats["saves"] }) {
  const top = saves.most_saved;
  return (
    <section>
      <SectionHead label="saved by others" meta={`${saves.total} ${saves.total === 1 ? "save" : "saves"}`} />
      <Totals
        items={[
          ["vault", saves.vault],
          ["collections", saves.collections],
          ["fits", saves.fits],
          ["pieces", saves.pieces],
        ]}
      />
      {saves.savers.length > 0 && (
        <Link href="/profile/savers" className="mt-4 flex min-h-14 items-center gap-3.5 border-y border-th-border py-3 hover:bg-th-surface">
          <span className="flex shrink-0">
            {saves.savers.slice(0, 5).map((s, i) => (
              <span key={s.username} className={`rounded-full ring-2 ring-th-bg ${i > 0 ? "-ml-1.5" : ""}`}>
                <Avatar src={s.avatar_url} username={s.username} size={32} />
              </span>
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[0.875rem] font-medium leading-[1.1875rem]">{saverNames(saves.savers, saves.saver_count)}</span>
            {saves.latest_at && <span className="block text-[0.8125rem] leading-[1.0625rem] text-th-muted">latest {timeAgo(saves.latest_at)}</span>}
          </span>
          <Icon name="chevron-right" size={16} className="shrink-0 text-th-muted" />
        </Link>
      )}
      {top && (
        <>
          <p className="th-label mb-2 mt-5">most saved</p>
          <RowList>
            <LinkedRow
              photo={top.photo}
              title={top.title ?? "untitled"}
              sub={`${KIND_LABEL[top.kind]} · saved ${top.count} ${top.count === 1 ? "time" : "times"}`}
              href={SAVED_HREF[top.kind](top.id)}
            />
          </RowList>
        </>
      )}
    </section>
  );
}

export function NavGroup({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-th-border overflow-hidden rounded-th-card bg-th-surface">{children}</div>;
}

export function NavRow({
  icon,
  title,
  sub,
  badge,
  href,
  onClick,
  danger,
}: {
  icon?: IconName;
  title: string;
  sub?: string;
  badge?: string | null;
  href?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  const inner = (
    <span className="flex min-h-[3.75rem] items-center gap-3.5 px-4 py-3 text-left">
      {icon && (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-th-inline-chip bg-th-bg">
          <Icon name={icon} size={18} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={`block text-[1rem] font-medium leading-[1.3125rem] ${danger ? "text-th-danger" : ""}`}>{title}</span>
        {sub && <span className="mt-0.5 block truncate text-[0.8125rem] leading-[1.0625rem] text-th-muted">{sub}</span>}
      </span>
      {badge && (
        <span className="flex shrink-0 items-center gap-1.5 text-th-accent">
          <span className="h-2 w-2 rounded-full bg-th-accent" />
          <span className={`${num} text-[0.8125rem] tracking-[0.03em]`}>{badge}</span>
        </span>
      )}
      {!danger && (href || onClick) && <Icon name="chevron-right" size={16} className="shrink-0 text-th-muted" />}
    </span>
  );
  const cls = "block w-full hover:bg-th-chip-pressed/50";
  if (!href && !onClick && !danger) return inner;
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={onClick ? "button" : "submit"} onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

export function SocialEmpty({ title, body, onShare }: { title: string; body: string; onShare?: () => void }) {
  return (
    <section>
      <SectionHead label="reactions · saves" />
      <div className="rounded-th-card bg-th-surface p-5">
        <p className="text-[1.0625rem] font-bold leading-[1.375rem] tracking-[-0.01em]">{title}</p>
        <p className="mt-1.5 text-[0.875rem] leading-5 text-th-muted [text-wrap:pretty]">{body}</p>
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="mt-3.5 inline-flex h-11 items-center gap-1.5 rounded-th-chip bg-th-bg px-4 text-[0.875rem] font-medium text-th-accent hover:bg-th-chip"
          >
            <Icon name="share" size={18} /> share vault
          </button>
        )}
      </div>
    </section>
  );
}
