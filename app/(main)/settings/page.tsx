import { requireUser, getUserProfile } from "@/lib/auth";

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl text-gray-900">Settings</h1>
      <p className="mt-2 text-sm text-gray-400">Profile settings coming soon.</p>

      <div className="mt-8 rounded-xl border border-[#E0D8CC] bg-[#FDFCFA] p-6">
        <p className="font-mono-display text-xs uppercase tracking-widest text-gray-400">Username</p>
        <p className="mt-1 text-sm text-gray-900">@{profile?.username}</p>

        <p className="mt-4 font-mono-display text-xs uppercase tracking-widest text-gray-400">Email</p>
        <p className="mt-1 text-sm text-gray-900">{user.email}</p>
      </div>
    </div>
  );
}
