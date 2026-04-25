"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const PILL_WIDTH = 220;

export function AddPill() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Animate in
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  function openMenu() {
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function handleAddPiece() {
    closeMenu();
    router.push("/vault/add");
  }

  function handleNewCollection() {
    closeMenu();
    router.push("/collections");
  }

  return (
    <>
      {/* Backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Pill + menu stack */}
      <div
        className="fixed bottom-7 left-1/2 z-50 flex flex-col items-center"
        style={{ transform: "translateX(-50%)", width: PILL_WIDTH }}
      >
        {/* Contextual menu — rendered above pill, same width */}
        <div
          className={`mb-2 w-full overflow-hidden rounded-[20px] bg-[#1C1C1E] transition-all duration-150 origin-bottom ${menuOpen ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.88] pointer-events-none"}`}
          ref={menuRef}
        >
          <button
            onClick={handleAddPiece}
            className="flex w-full items-center gap-3.5 px-5 py-[18px] hover:bg-white/5 transition-colors"
          >
            <AddPieceIcon />
            <span className="text-[16px] text-white">add piece</span>
          </button>

          <div className="h-px bg-white/[0.08]" />

          <button
            onClick={handleNewCollection}
            className="flex w-full items-center gap-3.5 px-5 py-[18px] hover:bg-white/5 transition-colors"
          >
            <NewCollectionIcon />
            <span className="text-[16px] text-white">new collection</span>
          </button>

          <div className="h-px bg-white/[0.08]" />

          {/* Cancel row covers the pill */}
          <button
            onClick={closeMenu}
            className="flex h-[50px] w-full items-center justify-center bg-[#2A2A2A]"
          >
            <span className="text-[15px] font-medium text-white/40">cancel</span>
          </button>
        </div>

        {/* Pill button */}
        <button
          onClick={openMenu}
          className={`flex h-[50px] w-full items-center justify-center rounded-[30px] bg-[#1A1A1A] text-[15px] font-medium text-white transition-opacity duration-200 hover:opacity-80 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}
        >
          add +
        </button>
      </div>
    </>
  );
}

function AddPieceIcon() {
  return (
    <div className="relative flex h-7 w-7 items-center justify-center rounded-[7px] border border-white/50">
      <div className="absolute h-[1.5px] w-3 rounded-sm bg-white/80" />
      <div className="absolute h-3 w-[1.5px] rounded-sm bg-white/80" />
    </div>
  );
}

function NewCollectionIcon() {
  return (
    <div className="flex h-7 w-7 flex-col items-center justify-center gap-1">
      <div className="h-0.5 w-4 rounded-sm bg-white/50" />
      <div className="h-0.5 w-5 rounded-sm bg-white/50" />
      <div className="h-0.5 w-4 rounded-sm bg-white/50" />
    </div>
  );
}
