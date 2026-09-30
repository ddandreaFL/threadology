"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

/**
 * The slide-over. A fit, piece or person opened from inside the app lands
 * here (the @panel slot's intercepting routes) instead of replacing the
 * page: the list you came from stays put behind it, scroll and all, and
 * closing returns you to exactly where you were.
 *
 * Desktop: a wide sheet from the right over a dimmed page; a click outside
 * or Esc closes it. Phone: it fills the screen, like a pushed screen in the
 * app. Every close is one step back in history, so the back chip, the
 * browser's back button and Esc all agree.
 *
 * Opened directly (a pasted link, a reload), the same URL renders as its
 * full page instead — interception only applies to navigation in the app.
 */
export function Panel({ children, label }: { children: ReactNode; label: string }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.back();
    window.addEventListener("keydown", onKey);
    // The page behind keeps its scroll position; it just stops scrolling.
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [router]);

  // Where the page is scrolled right now. The panel only ever renders on
  // the client (a direct load gets the full page, not the panel), so window
  // is always there.
  const [pageY] = useState(() => (typeof window === "undefined" ? 0 : window.scrollY));

  return (
    <>
      {/* For Next's router, which scrolls the page to whatever a navigation
          rendered: it skips fixed elements (the panel), and without an
          on-screen element to settle on it resets the page to the top. This
          1px marker sits at the current scroll position, reads as already
          on screen, and the list behind stays where you left it. */}
      <div aria-hidden className="pointer-events-none absolute left-0 h-px w-px" style={{ top: pageY }} />
      {/* Desktop: starts right of the side column (248px), which stays usable —
          a click there navigates, and the panel closes on its own (@panel's
          catch-all). Phone: the whole screen. */}
      <div className="fixed inset-0 z-[70] flex justify-end lg:left-[15.5rem]" role="dialog" aria-modal aria-label={label}>
        <button type="button" aria-label="close" tabIndex={-1} onClick={() => router.back()} className="animate-panel-fade hidden flex-1 cursor-default bg-th-ink/20 lg:block" />
        <div className="animate-panel-in relative h-full w-full overflow-y-auto overscroll-contain bg-th-bg lg:w-[min(60rem,calc(100vw-18.5rem))] lg:shadow-[-1.5rem_0_3.75rem_-1.875rem_rgba(27,26,23,0.35)]">
          {children}
        </div>
      </div>
    </>
  );
}
