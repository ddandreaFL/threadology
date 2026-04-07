"use client";

interface BrandInputProps {
  value: string;
  onChange: (value: string) => void;
  frequentBrands: string[];
}

const inputCls =
  "w-full rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-[#2D5A45] focus:ring-2 focus:ring-[#2D5A45]/20";

export function BrandInput({ value, onChange, frequentBrands }: BrandInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-700">Brand *</label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. Carhartt, Arc'teryx"
        className={inputCls}
      />

      {frequentBrands.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {frequentBrands.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => onChange(brand)}
              className="rounded-full border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-1 font-mono-display text-[11px] uppercase tracking-wide text-gray-500 transition-colors hover:border-[#2D5A45] hover:text-[#2D5A45]"
            >
              {brand}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
