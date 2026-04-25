"use client";

import { createContext, useContext, useEffect, useState } from "react";

type ViewMode = "coverflow" | "grid";

interface VaultUIContextValue {
  view: ViewMode;
  setView: (v: ViewMode) => void;
  query: string;
  setQuery: (q: string) => void;
  searchOpen: boolean;
  setSearchOpen: (o: boolean) => void;
}

const VaultUIContext = createContext<VaultUIContextValue>({
  view: "coverflow",
  setView: () => {},
  query: "",
  setQuery: () => {},
  searchOpen: false,
  setSearchOpen: () => {},
});

export function VaultUIProvider({ children }: { children: React.ReactNode }) {
  const [view, setViewState] = useState<ViewMode>("coverflow");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("vault-view") as ViewMode | null;
    if (saved === "coverflow" || saved === "grid") setViewState(saved);
  }, []);

  function setView(v: ViewMode) {
    setViewState(v);
    localStorage.setItem("vault-view", v);
  }

  return (
    <VaultUIContext.Provider value={{ view, setView, query, setQuery, searchOpen, setSearchOpen }}>
      {children}
    </VaultUIContext.Provider>
  );
}

export function useVaultUI() {
  return useContext(VaultUIContext);
}
