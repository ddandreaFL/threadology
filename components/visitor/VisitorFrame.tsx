import type { ReactNode } from "react";
import Link from "next/link";
import { AppBanner } from "./GetTheApp";
import { APP_STORE_URL } from "@/lib/app-store";
import { Logo } from "@/components/ui/Logo";

/**
 * The frame for someone else's vault, collection, fit or piece. On a phone
 * it is the app's screen with the get-the-app banner above it. On a desktop
 * it gets a quiet top bar — wordmark, get the app, and log in (or your own
 * vault, signed in) — and the content sits in a wide centered column.
 */
export function VisitorFrame({ signedIn, children, banner }: { signedIn: boolean; children: ReactNode; banner?: ReactNode }) {
  return (
    <div className="min-h-dvh bg-th-bg font-th-sans text-th-ink">
      <AppBanner />
      <header className="hidden items-center justify-between border-b border-th-border px-8 py-4 lg:flex">
        <Link href="/" className="flex items-center gap-2.5 font-th-label font-light text-[12px] uppercase tracking-[0.2em]">
          <Logo size={28} />
          threadology
        </Link>
        <nav className="flex items-center gap-2 text-[14px]">
          <a href={APP_STORE_URL} className="rounded-th-pill bg-[#1A1A1A] px-4 py-2 font-medium text-white hover:opacity-85">
            get the app
          </a>
          {signedIn ? (
            <Link href="/vault" className="rounded-th-pill px-4 py-2 text-th-muted hover:bg-th-surface hover:text-th-ink">
              your vault
            </Link>
          ) : (
            <Link href="/login" className="rounded-th-pill px-4 py-2 text-th-muted hover:bg-th-surface hover:text-th-ink">
              log in
            </Link>
          )}
        </nav>
      </header>
      {banner}
      <main className="mx-auto w-full max-w-6xl pb-16">{children}</main>
      <footer className="border-t border-th-border px-5 py-8 text-center">
        <p className="font-th-label font-light text-[11px] uppercase tracking-[0.2em] text-th-muted">threadology</p>
        <p className="mt-2 text-[13px] text-th-muted">An archive for the clothes you keep.</p>
        {!signedIn && (
          <Link href="/signup" className="mt-4 inline-block text-[13px] font-medium text-th-ink underline-offset-4 hover:underline">
            start your own vault →
          </Link>
        )}
      </footer>
    </div>
  );
}

/**
 * An owner looking at their own link on purpose (?preview=1): what they are
 * seeing, and the way back to their own screen.
 */
export function OwnerPreview({ href }: { href: string }) {
  return (
    <div className="mx-5 mt-4 flex items-center justify-between gap-4 rounded-th-chip bg-th-surface px-4 py-3 lg:mx-8">
      <p className="text-[13px] text-th-muted">This is your link — you are seeing what a visitor sees.</p>
      <Link href={href} className="shrink-0 text-[13px] font-medium text-th-accent underline-offset-2 hover:underline">
        my view
      </Link>
    </div>
  );
}
