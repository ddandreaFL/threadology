"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

export function VaultFAB() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center px-4"
      style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      {open && (
        <div className="mb-3 flex flex-col items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Link
            href="/vault/add"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-md transition-colors hover:bg-[#F5F1EA]"
          >
            Add a piece
          </Link>
          <Link
            href="/collections"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-md transition-colors hover:bg-[#F5F1EA]"
          >
            Create a collection
          </Link>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#1E3D2F] hover:shadow-xl active:scale-95"
      >
        <Plus className="h-4 w-4" />
        Add
      </button>
    </div>
  );
}
