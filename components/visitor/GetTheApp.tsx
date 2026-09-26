"use client";

import { useEffect, useState } from "react";
import { APP_STORE_URL } from "@/lib/app-store";

/**
 * The slim prompt at the top of a shared page on a phone: the app's icon
 * mark, one line, a "get" pill, and a close that is remembered. Visitors
 * often arrive without an account, following a friend's link; this is the
 * app telling them it exists, once, without getting in the way.
 */
export function AppBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(localStorage.getItem("app_banner_dismissed") !== "1");
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="flex items-center gap-3 border-b border-th-border bg-th-surface px-4 py-2.5 font-th-sans lg:hidden">
      <button
        aria-label="dismiss"
        onClick={() => {
          setShow(false);
          try {
            localStorage.setItem("app_banner_dismissed", "1");
          } catch {}
        }}
        className="text-[18px] leading-none text-th-muted"
      >
        ×
      </button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[#1A1A1A] font-th-mono text-[13px] text-white">t</span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-th-ink">threadology</p>
        <p className="truncate text-[12px] text-th-muted">Better in the app — cover flow, gallery, your own vault.</p>
      </div>
      <a href={APP_STORE_URL} className="rounded-full bg-[#1A1A1A] px-4 py-1.5 text-[13px] font-semibold text-white">
        get
      </a>
    </div>
  );
}

/**
 * The nudge at a natural stopping point — the end of a collection, after a
 * save, the edge of the gallery. A card, not a modal.
 */
export function AppNudge({ line = "Keep your own archive of the clothes you keep." }: { line?: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-th-card bg-[#1A1A1A] px-6 py-6 text-center font-th-sans">
      <p className="font-th-mono text-[11px] uppercase tracking-[0.2em] text-white/50">threadology</p>
      <p className="mt-2 text-[17px] font-medium tracking-[-0.01em] text-white">{line}</p>
      <div className="mt-5 flex flex-col gap-2">
        <a href={APP_STORE_URL} className="rounded-th-pill bg-white py-3 text-[15px] font-medium text-[#1A1A1A] transition-opacity hover:opacity-85">
          get the app
        </a>
        <a href="/signup" className="py-1 text-[13px] text-white/50 hover:text-white/80">
          or start on the web
        </a>
      </div>
    </div>
  );
}
