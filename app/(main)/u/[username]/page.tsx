import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fetchUserProfile } from "@/lib/friends";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { FriendButtons } from "@/components/friends/FriendButtons";
import { IdentityHead, SectionHead, Totals } from "@/components/profile/kit";
import { LinkedRow, RowList, Strip, Thumb } from "@/components/detail/kit";

export const dynamic = "force-dynamic";

/**
 * Someone else's profile, opened from their @name (the app's
 * app/(main)/u/[username].tsx). Anyone signed in gets the card and the
 * button to ask; a friend gets the archive — pieces that are not private,
 * collections and fits — each opening its own read-only page.
 */
export default async function UserPage({ params }: { params: { username: string } }) {
  await requireUser();
  const supabase = await createServerClient();
  const profile = await fetchUserProfile(supabase, decodeURIComponent(params.username));
  if (profile?.relationship === "self") redirect("/profile");

  if (!profile) {
    return (
      <div className="font-th-sans">
        <ScreenHeader title={`@${params.username}`} back={{ href: "/activity" }} />
        <p className="px-5 pt-16 text-center text-[0.875rem] text-th-muted">There&apos;s no one here by that name.</p>
      </div>
    );
  }

  const { user, relationship } = profile;
  const pieces = profile.pieces ?? [];
  const fits = profile.fits ?? [];
  const collections = profile.collections ?? [];

  return (
    <div className="font-th-sans">
      <ScreenHeader title={`@${user.username}`} back={{ href: "/activity" }} />
      <div className="th-page flex flex-col gap-7 pb-10 pt-3">
        <div className="flex flex-col gap-4">
          <IdentityHead user={user} />
          <FriendButtons username={user.username} relationship={relationship} />
        </div>

        {profile.pieces ? (
          <>
            <Totals
              items={[
                ["pieces", pieces.length],
                ["fits", fits.length],
                ["collections", collections.length],
              ]}
            />
            {fits.length > 0 && (
              <section>
                <SectionHead label="fits" />
                <div className="-mx-5">
                  <Strip items={fits.map((f) => ({ id: f.id, photo: f.photo, title: f.title ?? "untitled fit", date: f.date, href: `/friend/fit/${f.id}` }))} />
                </div>
              </section>
            )}
            {collections.length > 0 && (
              <section>
                <SectionHead label="collections" />
                <RowList>
                  {collections.map((c) => (
                    <LinkedRow key={c.id} photo={c.photo} title={c.name} sub={`${c.count} ${c.count === 1 ? "piece" : "pieces"}`} href={`/friend/collection/${c.id}`} />
                  ))}
                </RowList>
              </section>
            )}
            <section>
              <SectionHead label="pieces" />
              {pieces.length === 0 ? (
                <p className="text-[0.875rem] text-th-muted">Nothing here yet.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {pieces.map((p) => (
                    <Link key={p.id} href={`/friend/piece/${p.id}`} className="min-w-0 hover:opacity-85">
                      <Thumb src={p.photo} className="aspect-square w-full rounded-th-chip" />
                      <p className="mt-1.5 truncate text-[0.8125rem] leading-[1.0625rem]">{p.name ?? p.type}</p>
                      <p className="truncate text-[0.8125rem] leading-[1.0625rem] text-th-muted">{p.brand}</p>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="rounded-th-card bg-th-surface p-5">
            <p className="text-[1.0625rem] font-bold leading-[1.375rem] tracking-[-0.01em]">
              {relationship === "incoming" ? `@${user.username} wants to be friends` : "Friends see each other's archives"}
            </p>
            <p className="mt-1.5 text-[0.875rem] leading-5 text-th-muted">
              {relationship === "requested"
                ? "Once they accept, their pieces, collections and fits show up here — and yours for them."
                : "Pieces, collections and fits, minus anything marked private. Prices and values never show."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
