import { requireUser, getUserProfile } from "@/lib/auth";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { BillingSection } from "@/components/settings/billing-section";
import { getUserSubscription } from "@/lib/subscription";

export default async function SettingsPage() {
  const user = await requireUser();
  const [profile, subscription] = await Promise.all([
    getUserProfile(user.id),
    getUserSubscription(user.id),
  ]);

  return (
    <div className="mx-auto max-w-lg pb-24">
      <h1 className="text-[22px] font-medium tracking-[-0.02em] text-[#111111]">settings</h1>
      <p className="mt-1 text-[12px] text-[#999999]">
        @{profile?.username} · {user.email}
      </p>

      <div className="mt-6 border-t border-[#EBEBEB]">
        <BillingSection isPremium={subscription.isPremium} />
      </div>

      <div className="mt-8 border-t border-[#EBEBEB] pt-6">
        <p className="mb-5 text-[10px] uppercase tracking-[0.12em] text-[#999999]">profile</p>
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
