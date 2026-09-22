import Link from "next/link";
import { getUser, getUserProfile } from "@/lib/auth";

/**
 * The frame every shared page renders inside.
 *
 * Shared pages used to inherit the signed-in app shell, which put the vault
 * title, the search field and the layout switcher above someone else's
 * archive — controls that do nothing here and read as if the visitor were
 * looking at their own vault. A visitor state needs its own chrome: whose
 * app this is, and a way in. Nothing else.
 *
 * It also supplies the page's gutters. The shared routes sit outside the app
 * shell, so without this the content ran to the edge of the screen.
 */
export async function SharedChrome({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  const profile = user ? await getUserProfile(user.id) : null;

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-40 border-b border-[#EBEBEB] bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-5">
          <Link
            href={profile ? "/vault" : "/"}
            className="text-[20px] font-medium tracking-[-0.02em] text-[#111111] transition-opacity hover:opacity-70"
          >
            threadology
          </Link>
          {profile ? (
            <Link
              href="/vault"
              className="text-[14px] text-[#999999] transition-colors hover:text-[#111111]"
            >
              my vault
            </Link>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-[14px] text-[#999999] transition-colors hover:text-[#111111]"
              >
                log in
              </Link>
              <Link
                href="/signup"
                className="rounded-[30px] bg-[#1A1A1A] px-5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-80"
              >
                sign up
              </Link>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 pb-[calc(4rem+env(safe-area-inset-bottom))] pt-4">
        {children}
      </main>
    </div>
  );
}

/**
 * Shown to an owner who lands on their own share link with ?preview=1 — the
 * one case where we deliberately do not send them to their own screen.
 */
export function OwnerPreviewBanner({ href }: { href?: string }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl bg-[#F5F3EF] px-4 py-3">
      <p className="text-[13px] text-[#6B6358]">
        This is your link. You are seeing what a visitor sees.
      </p>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-[13px] font-medium text-[#2D5A45] underline-offset-2 hover:underline"
        >
          my view
        </Link>
      )}
    </div>
  );
}
