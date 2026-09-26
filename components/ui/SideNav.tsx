"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";
import { CREATE, TABS, isActive } from "./nav";
import { useUnread } from "./useUnread";

/**
 * The desktop layout's navigation. The same destinations as the phone's tab
 * bar, arranged for a wide screen: a persistent column with the four tabs,
 * a "new" menu in place of the +, and the places the app keeps under
 * profile (saved, notifications, settings) promoted to the column.
 */
export function SideNav({ username }: { username: string }) {
  const pathname = usePathname();
  const unread = useUnread();
  const [creating, setCreating] = useState(false);

  const row = (href: string, label: string, icon: Parameters<typeof Icon>[0]["name"], dot = false) => {
    const active = isActive(pathname, href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex h-11 items-center gap-3 rounded-th-chip px-3 text-[15px] transition-colors ${
          active ? "bg-th-chip font-semibold text-th-ink" : "text-th-muted hover:bg-th-surface hover:text-th-ink"
        }`}
      >
        <span className="relative">
          <Icon name={icon} size={20} />
          {dot && <span className="absolute -right-[3px] -top-px h-2 w-2 rounded-full bg-th-accent" />}
        </span>
        {label}
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-th-border px-4 py-6 font-th-sans lg:flex">
      <Link href="/vault" className="px-3 font-th-mono text-[12px] uppercase tracking-[0.2em] text-th-ink">
        threadology
      </Link>

      <div className="relative mt-8">
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          aria-expanded={creating}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-th-pill bg-[#1A1A1A] text-[14px] font-medium text-th-on-ink"
        >
          <Icon name={creating ? "close" : "plus"} size={18} /> new
        </button>
        {creating && (
          <div className="absolute inset-x-0 top-[52px] z-10 rounded-th-card bg-[#1A1A1A] py-2 shadow-lg">
            {CREATE.map((c) => (
              <Link key={c.href} href={c.href} onClick={() => setCreating(false)} className="flex h-11 items-center gap-3 px-4 text-[14px] text-th-on-ink hover:bg-white/5">
                <Icon name={c.icon} size={18} /> {c.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      <nav className="mt-6 flex flex-col gap-1" aria-label="primary">
        {TABS.map((t) => row(t.href, t.label, t.icon))}
      </nav>
      <nav className="mt-6 flex flex-col gap-1 border-t border-th-border pt-6" aria-label="account">
        {row("/saved", "saved", "bookmark")}
        {row("/notifications", "notifications", "bell", unread)}
        {row("/settings", "settings", "gear")}
      </nav>

      <p className="mt-auto truncate px-3 text-[13px] text-th-muted">@{username}</p>
    </aside>
  );
}
