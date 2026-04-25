"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useVaultUI } from "./VaultUIContext";

interface TopBarProps {
  initial: string;
  onAvatarPress: () => void;
}

function titleFromPath(pathname: string): string {
  if (pathname.startsWith("/settings")) return "settings";
  if (pathname.startsWith("/collections")) return "collections";
  if (pathname.startsWith("/profile")) return "profile";
  return "vault";
}

export function TopBar({ initial, onAvatarPress }: TopBarProps) {
  const pathname = usePathname();
  const { view, setView, query, setQuery, searchOpen, setSearchOpen } = useVaultUI();
  const searchRef = useRef<HTMLInputElement>(null);

  const title = titleFromPath(pathname);
  const isVaultPage = title === "vault";

  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  function toggleSearch() {
    if (searchOpen) {
      setSearchOpen(false);
      setQuery("");
    } else {
      setSearchOpen(true);
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#EBEBEB]">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        {searchOpen ? (
          <>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="search brand, name, type…"
              className="flex-1 text-[15px] text-[#111111] placeholder:text-[#BBBBBB] outline-none mr-3"
            />
            <button
              onClick={toggleSearch}
              className="text-[14px] text-[#999999] shrink-0"
            >
              cancel
            </button>
          </>
        ) : (
          <>
            <span className="text-[20px] font-medium tracking-[-0.02em] text-[#111111]">
              {title}
            </span>

            <div className="flex items-center gap-[18px]">
              {isVaultPage && (
                <>
                  <button onClick={toggleSearch} className="p-1" aria-label="Search">
                    <SearchIcon />
                  </button>

                  <button
                    onClick={() => setView(view === "coverflow" ? "grid" : "coverflow")}
                    className="p-1"
                    aria-label="Toggle view"
                  >
                    {view === "coverflow" ? <GridIcon /> : <CoverflowIcon />}
                  </button>
                </>
              )}

              <button
                onClick={onAvatarPress}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#1A1A1A] text-[12px] font-semibold text-white shrink-0"
                aria-label="Open menu"
              >
                {initial}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
      <circle cx="8.5" cy="8.5" r="5.5" stroke="#111111" strokeWidth="1.5" />
      <path d="M13 13l3.5 3.5" stroke="#111111" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="#111111">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function CoverflowIcon() {
  return (
    <svg width="22" height="20" viewBox="0 0 22 20" fill="currentColor">
      <rect x="8" y="1" width="6" height="18" rx="2" fill="#111111" />
      <rect x="1" y="4" width="5" height="12" rx="1.5" fill="#CCCCCC" />
      <rect x="16" y="4" width="5" height="12" rx="1.5" fill="#CCCCCC" />
    </svg>
  );
}
