import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { getShareState } from "@/lib/share-state";
import { SettingsView } from "@/components/owner/SettingsView";

export const metadata = { title: "settings · threadology" };

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, share] = await Promise.all([getUserProfile(user.id), createServerClient().then((s) => getShareState(s, "vault", user.id))]);
  return (
    <SettingsView
      userId={user.id}
      username={profile?.username ?? user.email?.split("@")[0] ?? "you"}
      email={user.email ?? null}
      share={share}
    />
  );
}
