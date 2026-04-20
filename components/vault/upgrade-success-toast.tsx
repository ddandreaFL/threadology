"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      setVisible(true);
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => setVisible(false)}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300" />

      {/* Modal */}
      <div
        className="relative w-full max-w-sm rounded-3xl border border-[#2D5A45]/20 bg-white p-8 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#2D5A45]/10">
          <svg className="h-7 w-7 text-[#2D5A45]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="font-serif text-2xl text-gray-900">Welcome to Premium</h2>
        <p className="mt-2 text-sm text-gray-500">
          Your vault is now unlimited. Document your entire wardrobe with no ceiling.
        </p>

        <button
          onClick={() => setVisible(false)}
          className="mt-7 w-full rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
        >
          Start adding pieces
        </button>

        <p className="mt-3 text-xs text-gray-400">Cancel anytime from Settings.</p>
      </div>
    </div>
  );
}
