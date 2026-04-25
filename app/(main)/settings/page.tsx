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

      <div className="mt-8 border-t border-[#EBEBEB] pt-6">
        <p className="mb-5 text-[10px] uppercase tracking-[0.12em] text-[#999999]">legal</p>
        <div className="flex flex-col gap-1">
          {[
            { label: "privacy policy", href: "/legal/privacy" },
            { label: "terms of service", href: "/legal/terms" },
            { label: "security", href: "/legal/security" },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              className="flex items-center justify-between py-4 border-b border-[#EBEBEB] text-[15px] font-medium text-[#111111] hover:text-[#999999] transition-colors"
            >
              {label}
              <span className="text-[18px] text-[#CCCCCC]">›</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
