import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { OwnerProfile } from "@/components/owner/OwnerProfile";

/** You — the app's profile tab. */
export default async function ProfilePage() {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) return null;
  const [{ count }, share] = await Promise.all([
    supabase.from("pieces").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    getShareState(supabase, "vault", user.id),
  ]);
  return (
    <OwnerProfile
      userId={user.id}
      username={profile.username}
      avatarUrl={profile.avatar_url}
      bio={profile.bio}
      since={new Date(profile.created_at).getFullYear()}
      pieceCount={count ?? 0}
      share={share}
    />
  );
}
