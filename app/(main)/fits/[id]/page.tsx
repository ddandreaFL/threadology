import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

/**
 * One of your fits, signed in: the photos, the pieces worn, and what came
 * back — reactions and who left them. The shared view of a fit lives at
 * /fit/<user>/<slug>?k= and needs its link token; this is the owner's own
 * page and needs neither.
 */
export default async function OwnerFitPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);

  const { data: fit } = await supabase
    .from("fits")
    .select("id, title, caption, date, location, photos, fit_pieces(layer_order, pieces(id, name, type, brand, photos))")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();
  if (!fit) notFound();

  const [{ data: counts }, { data: who }] = await Promise.all([
    supabase.rpc("fit_reactions_for_owner", { p_fit_id: fit.id }),
    // Deployed with stage_four_reactors.sql; a failed call just leaves the counts.
    supabase.rpc("fit_reactors_for_owner" as never, { p_fit_id: fit.id } as never),
  ]);
  const reactions = (Array.isArray(counts) ? counts : []) as { emoji: string; count: number }[];
  const reactors = (Array.isArray(who) ? who : []) as { emoji: string; username: string; created_at: string }[];

  const pieces = ((fit.fit_pieces ?? []) as { layer_order: number; pieces: { id: string; name: string | null; type: string; brand: string; photos: string[] } | null }[])
    .sort((a, b) => a.layer_order - b.layer_order)
    .map((fp) => fp.pieces)
    .filter((p): p is NonNullable<typeof p> => !!p);

  const date = fit.date
    ? new Date(fit.date).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <Link href="/fits" className="text-[13px] text-[#999999] transition-colors hover:text-[#111111]">
        ← fits
      </Link>

      <h1 className="mt-6 text-[22px] font-medium tracking-[-0.02em] text-[#111111]">{fit.title || "untitled fit"}</h1>
      <p className="mt-1 text-[12px] text-[#999999]">{[date, fit.location].filter(Boolean).join("  ·  ")}</p>

      <div className="mt-6 grid gap-3">
        {(fit.photos ?? []).map((src: string) => (
          <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F5F5F5]">
            <Image src={src} alt={fit.title ?? "fit"} fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" />
          </div>
        ))}
      </div>

      {fit.caption && (
        <p className="mt-8 border-l-2 border-[#2D5A45] pl-4 text-[15px] leading-relaxed text-[#111111]">{fit.caption}</p>
      )}

      {pieces.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#999999]">worn</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {pieces.map((p) => (
              <Link key={p.id} href={`/vault/${profile?.username}/${p.id}`} className="block">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-[#F5F5F5]">
                  {p.photos?.[0] ? <Image src={p.photos[0]} alt={p.name ?? p.type} fill sizes="200px" className="object-cover" /> : null}
                </div>
                <p className="mt-1.5 truncate text-[12px] text-[#111111]">{p.name ?? p.type}</p>
                <p className="truncate text-[11px] text-[#999999]">{p.brand}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {reactions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#999999]">reactions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {reactions.map((r) => (
              <span key={r.emoji} className="rounded-full border border-[#E8E5DE] px-3 py-1.5 text-[14px]">
                {r.emoji} <span className="ml-1 text-[12px] font-semibold text-[#6B6358]">{r.count}</span>
              </span>
            ))}
          </div>
          {reactors.length > 0 && (
            <ul className="mt-4 space-y-2">
              {reactors.map((r) => (
                <li key={`${r.username}-${r.emoji}`} className="flex items-center justify-between text-[14px] text-[#111111]">
                  <span>@{r.username}</span>
                  <span>{r.emoji}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
