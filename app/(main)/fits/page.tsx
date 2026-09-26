import Link from "next/link";
import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

/**
 * Your fits. The web had a form to log one and nowhere to see them after:
 * this is the list, newest first, as in the app's fits tab.
 */
export default async function FitsPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("fits")
    .select("id, title, photos, date, created_at, fit_pieces(piece_id)")
    .eq("user_id", user.id)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  const fits = data ?? [];

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-medium tracking-[-0.02em] text-[#111111]">fits</h1>
          <p className="mt-1 text-[12px] text-[#999999]">{fits.length} documented</p>
        </div>
        <Link
          href="/fit/new"
          className="rounded-[30px] bg-[#1A1A1A] px-4 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-80"
        >
          log a fit
        </Link>
      </div>

      {fits.length === 0 ? (
        <p className="py-24 text-center text-[13px] text-[#999999]">Nothing documented yet.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6">
          {fits.map((f) => {
            const count = (f.fit_pieces ?? []).length;
            const date = f.date
              ? new Date(f.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
              : "";
            return (
              <Link key={f.id} href={`/fits/${f.id}`} className="block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-[#F5F5F5]">
                  {f.photos?.[0] ? (
                    <Image src={f.photos[0]} alt={f.title ?? "fit"} fill sizes="(max-width: 768px) 50vw, 320px" className="object-cover" />
                  ) : null}
                </div>
                <p className="mt-2 truncate text-[13px] font-medium text-[#111111]">{f.title || "untitled fit"}</p>
                <p className="mt-0.5 text-[11px] text-[#999999]">
                  {[date, `${count} ${count === 1 ? "piece" : "pieces"}`].filter(Boolean).join("  ·  ")}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
