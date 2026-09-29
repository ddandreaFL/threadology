import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fetchProfileStats } from "@/lib/profile-stats";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { RankList } from "@/components/profile/kit";

export const metadata = { title: "brands · threadology" };

/** "see all" from top brands: every brand, the same rows. */
export default async function BrandsPage() {
  const user = await requireUser();
  const stats = await fetchProfileStats(await createServerClient(), user.id);
  if (!stats) redirect("/profile");
  const n = stats.brands.length;
  return (
    <div className="font-th-sans">
      <ScreenHeader title="brands" subtitle={`${n} ${n === 1 ? "brand" : "brands"}`} back={{ href: "/profile" }} />
      <div className="mx-auto max-w-xl px-5 pb-10 pt-3">
        <RankList rows={stats.brands} />
      </div>
    </div>
  );
}
