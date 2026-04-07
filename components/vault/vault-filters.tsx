"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "added", label: "Recently Added" },
  { value: "updated", label: "Recently Updated" },
  { value: "brand", label: "Brand A–Z" },
  { value: "year_asc", label: "Year (Oldest)" },
  { value: "year_desc", label: "Year (Newest)" },
];

const selectCls =
  "rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-1.5 font-mono-display text-xs text-gray-700 outline-none transition-colors focus:border-[#2D5A45] cursor-pointer";

interface VaultFiltersProps {
  brands: string[];
  types: string[];
}

export function VaultFilters({ brands, types }: VaultFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    router.push(`?${next.toString()}`, { scroll: false });
  }

  const sort = params.get("sort") || "added";
  const type = params.get("type") || "";
  const brand = params.get("brand") || "";
  const hasActiveFilters = !!type || !!brand;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={sort}
        onChange={(e) =>
          update("sort", e.target.value !== "added" ? e.target.value : null)
        }
        className={selectCls}
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {types.length > 1 && (
        <select
          value={type}
          onChange={(e) => update("type", e.target.value || null)}
          className={selectCls}
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
      )}

      {brands.length > 1 && (
        <select
          value={brand}
          onChange={(e) => update("brand", e.target.value || null)}
          className={selectCls}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      )}

      {hasActiveFilters && (
        <button
          onClick={() => {
            const next = new URLSearchParams();
            if (sort !== "added") next.set("sort", sort);
            router.push(`?${next.toString()}`, { scroll: false });
          }}
          className="font-mono-display text-xs text-gray-400 transition-colors hover:text-gray-700"
        >
          Clear ×
        </button>
      )}
    </div>
  );
}
