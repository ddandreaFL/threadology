"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/components/ui/Icon";
import { ScreenHeader } from "@/components/ui/ScreenHeader";

export type SavedRow = {
  container_type: "vault" | "collection" | "fit";
  container_id: string;
  share_token: string | null;
  notify: boolean;
  saved_at: string;
  owner_username: string;
  owner_avatar: string | null;
  title: string | null;
  slug: string | null;
  thumbnail: string | null;
  active: boolean;
};

function href(r: SavedRow): string | null {
  if (!r.active || !r.share_token) return null;
  if (r.container_type === "vault") return `/vault/${r.owner_username}?k=${r.share_token}`;
  if (r.container_type === "collection") return `/vault/${r.owner_username}/c/${r.slug}?k=${r.share_token}`;
  return `/fit/${r.owner_username}/${r.slug}?k=${r.share_token}`;
}

const key = (r: SavedRow) => `${r.container_type}-${r.container_id}`;

/**
 * The shelf — the app's saved screen (threadology-native/app/(main)/
 * saved.tsx): links you were sent and kept, each with a bell to mute it and
 * a remove that can be undone for a few seconds. A link whose owner stopped
 * sharing stays, marked, rather than vanishing.
 */
export function SavedShelf({ userId, initial }: { userId: string; initial: SavedRow[] }) {
  const [rows, setRows] = useState(initial);
  const [removed, setRemoved] = useState<SavedRow | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function reload() {
    const { data } = await supabase.rpc("my_saves" as never);
    setRows((Array.isArray(data) ? data : []) as SavedRow[]);
  }

  async function unsave(r: SavedRow) {
    setRows((prev) => prev.filter((x) => key(x) !== key(r)));
    setRemoved(r);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setRemoved(null), 4000);
    const { error } = await supabase.rpc("unsave_container" as never, { p_container_type: r.container_type, p_container_id: r.container_id } as never);
    if (error) {
      setRemoved(null);
      reload();
    }
  }

  /** Undo goes back through the saved link, the same way the save first did. */
  async function undo() {
    const r = removed;
    if (!r?.share_token) return;
    setRemoved(null);
    const { error } = await supabase.rpc("save_container" as never, { p_container_type: r.container_type, p_token: r.share_token, p_notify: r.notify } as never);
    if (!error) reload();
  }

  async function toggleNotify(r: SavedRow) {
    const next = !r.notify;
    const set = (v: boolean) => setRows((prev) => prev.map((x) => (key(x) === key(r) ? { ...x, notify: v } : x)));
    set(next);
    const { error } = await supabase
      .from("saves" as never)
      .update({ notify: next } as never)
      .eq("user_id", userId)
      .eq("container_type", r.container_type)
      .eq("container_id", r.container_id);
    if (error) set(r.notify);
  }

  return (
    <div className="font-th-sans">
      <ScreenHeader title="saved" subtitle={`${rows.length} kept`} back={{ href: "/profile" }} />
      {rows.length === 0 ? (
        <div className="px-10 py-24 text-center">
          <p className="text-[15px] text-th-ink">Nothing saved yet.</p>
          <p className="mt-2 text-[14px] text-th-muted">Open a link someone sends you and save it — it will wait here, and you will hear when it grows.</p>
        </div>
      ) : (
        <ul className="mx-auto max-w-2xl divide-y divide-[#F0F0F0] px-5">
          {rows.map((r) => {
            const to = href(r);
            const row = (
              <div className={`flex min-w-0 flex-1 items-center gap-3 py-4 ${to ? "transition-opacity hover:opacity-70" : "opacity-60"}`}>
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-th-surface">
                  {r.thumbnail && <Image src={r.thumbnail} alt="" fill sizes="56px" className="object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] text-th-ink">{r.title ?? "untitled"}</p>
                  <p className="mt-0.5 truncate text-[13px] text-th-muted">
                    @{r.owner_username} · {r.container_type}
                    {r.active ? "" : " · no longer shared"}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={key(r)} className="flex items-center gap-1">
                {to ? (
                  <Link href={to} className="flex min-w-0 flex-1">
                    {row}
                  </Link>
                ) : (
                  row
                )}
                {r.active && (
                  <button
                    type="button"
                    onClick={() => toggleNotify(r)}
                    aria-label={r.notify ? "mute updates" : "notify me of updates"}
                    className={`flex h-9 w-9 items-center justify-center rounded-full hover:bg-th-chip ${r.notify ? "text-th-accent" : "text-[#BBBBBB]"}`}
                  >
                    <Icon name={r.notify ? "bell" : "bell-off"} size={18} />
                  </button>
                )}
                <button type="button" onClick={() => unsave(r)} aria-label="remove from saved" className="flex h-9 w-9 items-center justify-center rounded-full text-[#BBBBBB] hover:bg-th-chip hover:text-th-ink">
                  <Icon name="close" size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {removed && (
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+112px)] z-40 mx-auto flex max-w-sm items-center justify-between rounded-full bg-[#1A1A1A] py-2.5 pl-5 pr-2 text-[14px] text-white shadow-lg lg:bottom-8">
          removed {removed.title ?? "it"}
          {removed.share_token && (
            <button type="button" onClick={undo} className="rounded-full px-3 py-1 font-semibold text-[#9FD3B8]">
              undo
            </button>
          )}
        </div>
      )}
    </div>
  );
}
