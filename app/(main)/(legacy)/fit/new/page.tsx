import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { FitForm } from "@/components/fit/fit-form";

export default async function NewFitPage() {
  const user = await requireUser();
  const supabase = await createServerClient();

  const [profile, piecesResult] = await Promise.all([
    getUserProfile(user.id),
    supabase
      .from("pieces")
      .select("id, brand, type, name, photos, crop_positions")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const pieces = piecesResult.data ?? [];

  return (
    <div className="mx-auto max-w-2xl pb-16">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/vault"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-gray-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Vault
        </Link>
        <h1 className="mt-4 text-2xl text-gray-900">Log a Fit</h1>
      </div>

      <FitForm
        userId={user.id}
        username={profile?.username ?? user.id}
        pieces={pieces}
      />
    </div>
  );
}
