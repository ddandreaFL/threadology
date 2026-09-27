"use client";

import { useEffect, useState } from "react";

/** Cover flow or grid, remembered per screen — as the app does. */
export function useViewMode(key: string, initial: "coverflow" | "grid" = "coverflow") {
  const [mode, setMode] = useState(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v === "coverflow" || v === "grid") setMode(v);
    } catch {}
  }, [key]);
  const toggle = () =>
    setMode((m) => {
      const next = m === "coverflow" ? "grid" : "coverflow";
      try {
        localStorage.setItem(key, next);
      } catch {}
      return next;
    });
  const action =
    mode === "coverflow"
      ? { icon: "grid" as const, label: "show grid", onClick: toggle }
      : { icon: "coverflow" as const, label: "show cover flow", onClick: toggle };
  return { mode, toggle, action };
}
