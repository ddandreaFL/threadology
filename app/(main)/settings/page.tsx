import { requireUser, getUserProfile } from "@/lib/auth";
import { SettingsView } from "@/components/owner/SettingsView";

export const metadata = { title: "settings · threadology" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  return (
    <SettingsView
      userId={user.id}
      username={profile?.username ?? user.email?.split("@")[0] ?? "you"}
      email={user.email ?? null}
      bio={profile?.bio ?? null}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
