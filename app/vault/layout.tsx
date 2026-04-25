import Link from "next/link";
import { getUser, getUserProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

export default async function VaultPublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const profile = user ? await getUserProfile(user.id) : null;

  if (user && profile) {
    const username = profile.username ?? user.email?.split("@")[0] ?? "";
    const initial = username.charAt(0).toUpperCase();
    return (
      <AppShell username={username} initial={initial} userId={user.id}>
        {children}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 bg-white border-b border-[#EBEBEB]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            href="/"
            className="text-[20px] font-medium tracking-[-0.02em] text-[#111111] transition-opacity hover:opacity-70"
          >
            threadology
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[14px] text-[#999999] transition-colors hover:text-[#111111]">
              log in
            </Link>
            <Link
              href="/signup"
              className="rounded-[30px] bg-[#1A1A1A] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-80"
            >
              sign up
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">{children}</main>
    </div>
  );
}
