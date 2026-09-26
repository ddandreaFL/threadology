"use client";

/**
 * Choice chips (threadology-native/components/piece/fields.tsx): one of a
 * set, ink when selected, and tapping the selected one clears it. A saved
 * value that is not among the options shows as its own chip rather than
 * disappearing.
 */
export function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-full border px-3.5 py-2 font-th-sans text-[13px] transition-colors ${
        selected ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#EBEBEB] bg-white text-th-ink hover:border-th-ink"
      }`}
    >
      {label}
    </button>
  );
}

export function ChipRow({
  options,
  value,
  onChange,
  labels,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string | null) => void;
  labels?: Record<string, string>;
}) {
  const all = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <div className="flex flex-wrap gap-2">
      {all.map((o) => (
        <Chip key={o} label={labels?.[o] ?? o} selected={value === o} onClick={() => onChange(value === o ? null : o)} />
      ))}
    </div>
  );
}
