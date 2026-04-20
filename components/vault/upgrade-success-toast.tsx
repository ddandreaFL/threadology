"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function UpgradeSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("upgraded") === "true") {
      // Show a simple banner — no external toast library needed
      const banner = document.createElement("div");
      banner.textContent = "Welcome to Premium! You now have unlimited pieces.";
      banner.style.cssText = `
        position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
        background: #2D5A45; color: white; padding: 12px 20px;
        border-radius: 9999px; font-size: 14px; font-weight: 500;
        z-index: 100; white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeIn 0.3s ease;
      `;
      document.body.appendChild(banner);

      const timer = setTimeout(() => {
        banner.remove();
      }, 4000);

      router.replace(window.location.pathname);

      return () => {
        clearTimeout(timer);
        banner.remove();
      };
    }
  }, [searchParams, router]);

  return null;
}
