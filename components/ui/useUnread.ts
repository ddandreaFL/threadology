"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Whether anything in the inbox is unread — the dot on profile, as in the
 * app. Re-read on every navigation and when the tab comes back into view.
 */
export function useUnread() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const read = () =>
      supabase.rpc("unread_notification_count" as never).then(({ data }) => {
        if (!cancelled) setUnread(typeof data === "number" && data > 0);
      });
    read();
    const onVisible = () => document.visibilityState === "visible" && read();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname]);
  return unread;
}
