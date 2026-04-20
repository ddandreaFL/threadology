"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

interface VaultSearchProps {
  onSearch: (query: string) => void;
}

export function VaultSearch({ onSearch }: VaultSearchProps) {
  const [query, setQuery] = useState("");

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value);
  };

  const clear = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative mb-4">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search pieces..."
        className="w-full rounded-lg border border-[#E0D8CC] bg-white py-2 pl-10 pr-10 text-sm focus:border-[#2D5A45] focus:outline-none"
      />
      {query && (
        <button
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
