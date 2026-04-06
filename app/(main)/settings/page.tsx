import { requireUser, getUserProfile } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <div className="mx-auto max-w-lg pb-24">
      <h1 className="font-serif text-2xl text-gray-900">Settings</h1>
      <p className="mt-1 font-mono-display text-xs text-gray-400">
        @{profile?.username} &middot; {user.email}
      </p>

      <div className="mt-8 rounded-2xl border border-[#E0D8CC] bg-[#FDFCFA] p-6">
        <p className="mb-5 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
          Profile
        </p>
        <ProfileSettingsForm
          userId={user.id}
          currentBio={profile?.bio ?? null}
          currentAvatarUrl={profile?.avatar_url ?? null}
          username={profile?.username ?? user.email ?? "?"}
        />
      </div>
    </div>
  );
}
