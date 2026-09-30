"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { CREATE, TABS, isActive, isEditor } from "./nav";
import { useUnread } from "./useUnread";

/**
 * The app's pill tab bar, for phones (threadology-native/components/nav/
 * TabBar.tsx): vault · fits · + · collections · profile, a 66pt stone pill
 * 26pt above the safe area, the + expanding into a menu of what it makes.
 * Hidden on desktop, where SideNav takes its place.
 */
export function TabBar() {
  const pathname = usePathname();
  const unread = useUnread();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const tab = (t: (typeof TABS)[number]) => {
    const active = isActive(pathname, t.href);
    return (
      <Link
        key={t.href}
        href={t.href}
        aria-current={active ? "page" : undefined}
        className={`flex w-[3.875rem] flex-col items-center justify-center gap-1 ${active ? "text-th-accent" : "text-th-muted"}`}
      >
        <span className="relative">
          <Icon name={t.icon} size={22} />
          {t.href === "/profile" && unread && (
            <span className="absolute -right-[0.1875rem] -top-px h-2 w-2 rounded-full border-[0.0938rem] border-th-nav-pill bg-th-accent" />
          )}
        </span>
        <span className={`text-[0.625rem] ${active ? "font-bold" : "font-medium"}`}>{t.label}</span>
      </Link>
    );
  };

  if (isEditor(pathname)) return null;

  return (
    <div className="lg:hidden">
      {open && <button aria-label="close menu" className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />}
      <nav
        className="fixed inset-x-4 z-[61] font-th-sans"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 26px)" }}
        aria-label="primary"
      >
        {open && (
          <div className="absolute bottom-[4.75rem] left-1/2 w-[12.5rem] -translate-x-1/2 animate-[fadeIn_160ms_ease-out] rounded-th-card bg-[#1A1A1A] py-2">
            {CREATE.map((c) => (
              <Link key={c.href} href={c.href} className="flex h-11 items-center gap-3 px-4 text-[0.875rem] text-th-on-ink hover:bg-white/5">
                <Icon name={c.icon} size={18} color="currentColor" />
                {c.label}
              </Link>
            ))}
          </div>
        )}
        <div className={`flex h-[4.125rem] items-center justify-between rounded-th-pill border border-th-border bg-th-nav-pill px-3 transition-opacity ${open ? "opacity-40" : ""}`}>
          {TABS.slice(0, 2).map(tab)}
          <span className="w-[3.875rem]" />
          {TABS.slice(2).map(tab)}
        </div>
        <button
          type="button"
          aria-label={open ? "close" : "create"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="absolute left-1/2 top-[0.375rem] flex h-[3.375rem] w-[3.375rem] -translate-x-1/2 items-center justify-center rounded-th-fab bg-[#1A1A1A] text-th-on-ink"
        >
          <Icon name={open ? "close" : "plus"} size={24} />
        </button>
      </nav>
    </div>
  );
}
