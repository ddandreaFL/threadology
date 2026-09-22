import Link from "next/link";
import { getUser, getUserProfile } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";

/**
 * The frame for a page under /vault that is not a share link — the piece
 * page and its editor. Signed in, it is the app shell; signed out, a plain
 * public header.
 *
 * This used to be the layout for everything under /vault, which is how the
 * app shell ended up above shared pages too. Shared routes now bring their
 * own chrome, and this stayed with the pages that actually want the shell.
 */
export async function OwnerPageShell({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const profile = user ? await getUserProfile(user.id) : null;

  if (user && profile) {
    const username = profile.username ?? user.email?.split("@")[0] ?? "";
    return (
      <AppShell username={username} initial={username.charAt(0).toUpperCase()} userId={user.id}>
        {children}
      </AppShell>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-[#EBEBEB] bg-white pt-[env(safe-area-inset-top)]">
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
      <main className="mx-auto max-w-5xl px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
    </div>
  );
}
