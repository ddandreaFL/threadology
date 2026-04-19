import Link from "next/link";
import { getUser, getUserProfile } from "@/lib/auth";
import { UserMenu } from "@/components/layout/user-menu";

export default async function VaultPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = user ? await getUserProfile(user.id) : null;
  const username = profile?.username ?? user?.email?.split("@")[0] ?? "";

  return (
    <div className="min-h-screen bg-[#F5F1EA]">
      <header className="sticky top-0 z-40 bg-[#F5F1EA]/90 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href={user ? "/vault" : "/"}
            className="font-sans text-lg font-semibold tracking-tight text-gray-900 transition-opacity hover:opacity-70"
          >
            Threadology
          </Link>

          {user && profile ? (
            <UserMenu username={username} avatarUrl={profile.avatar_url} isPremium={profile.is_premium} />
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-[#2D5A45] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">{children}</main>
    </div>
  );
}
