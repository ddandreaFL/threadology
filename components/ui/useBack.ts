"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * Back, the way the app does it: to wherever you came from. A back chip with
 * a fixed destination sent you to /fits from a fit you opened in saved, or
 * to /profile from saved you opened from the side column.
 *
 * Only history made inside the site counts — a link opened fresh (a new
 * tab, a message, a reload) has nothing of ours behind it, so back goes to
 * the screen's own parent instead of out of the site.
 */
let movedInSite = false;

/** Mounted once, in the root layout: notes the first in-site navigation. */
export function NavTracker() {
  const pathname = usePathname();
  const landed = useRef(pathname);
  useEffect(() => {
    if (pathname !== landed.current) movedInSite = true;
  }, [pathname]);
  return null;
}

export function useBack(fallback: string) {
  const router = useRouter();
  return () => (movedInSite ? router.back() : router.push(fallback));
}
