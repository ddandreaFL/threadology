import Link from "next/link";
import { requireUser, getUserProfile } from "@/lib/auth";
import { UserMenu } from "@/components/layout/user-menu";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);

  const username = profile?.username ?? user.email?.split("@")[0] ?? "you";
  const avatarUrl = profile?.avatar_url ?? null;

  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      <header className="sticky top-0 z-40 border-b border-[#E0D8CC] bg-[#F5F1EA]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/vault"
            className="text-lg font-semibold tracking-tight text-gray-900 hover:opacity-70 transition-opacity"
          >
            Threadology
          </Link>

          <UserMenu username={username} avatarUrl={avatarUrl} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
