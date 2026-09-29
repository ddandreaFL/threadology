import { requireUser, getUserProfile } from "@/lib/auth";
import { EditProfile } from "@/components/owner/EditProfile";

export const metadata = { title: "edit profile · threadology" };

export default async function EditProfilePage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  return (
    <EditProfile
      userId={user.id}
      username={profile?.username ?? user.email?.split("@")[0] ?? "you"}
      bio={profile?.bio ?? null}
      avatarUrl={profile?.avatar_url ?? null}
    />
  );
}
