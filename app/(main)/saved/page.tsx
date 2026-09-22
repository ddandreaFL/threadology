import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

/**
 * The shelf: links you were sent and kept.
 *
 * Each row opens through the token it was saved with, so a saved container
 * goes through the same gate it came through. When the owner switches
 * sharing off the row stays, marked inactive — a link going quiet is
 * information, and silently dropping it would read as a bug.
 */

type SavedRow = {
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
  if (r.container_type === "collection")
    return `/vault/${r.owner_username}/c/${r.slug}?k=${r.share_token}`;
  return `/fit/${r.owner_username}/${r.slug}?k=${r.share_token}`;
}

export default async function SavedPage() {
  await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase.rpc("my_saves" as never);
  const rows = (Array.isArray(data) ? data : []) as SavedRow[];

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-24 text-center">
        <p className="text-[15px] text-[#111111]">Nothing saved yet.</p>
        <p className="mt-2 text-[14px] text-[#999999]">
          Open a link someone sends you and save it — it will wait here, and you will hear
          when it grows.
        </p>
      </div>
    );
  }

  return (
    <ul className="mx-auto max-w-2xl divide-y divide-[#F0F0F0]">
      {rows.map((r) => {
        const to = href(r);
        const body = (
          <div className={`flex items-center gap-3 py-4 ${to ? "transition-opacity hover:opacity-70" : "opacity-60"}`}>
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[10px] bg-[#F2F0EC]">
              {r.thumbnail && <Image src={r.thumbnail} alt="" fill sizes="56px" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] text-[#111111]">{r.title ?? "untitled"}</p>
              <p className="mt-0.5 truncate text-[13px] text-[#999999]">
                @{r.owner_username} · {r.container_type}
                {r.active ? "" : " · no longer shared"}
              </p>
            </div>
            {r.notify && r.active && (
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-[#2D5A45]">
                notifying
              </span>
            )}
          </div>
        );
        return (
          <li key={`${r.container_type}-${r.container_id}`}>
            {to ? <Link href={to}>{body}</Link> : body}
          </li>
        );
      })}
    </ul>
  );
}
