"use client";

import type { ReactNode } from "react";

/**
 * The editors' chrome, shared by add piece, edit piece and the fit
 * editors: a column of fields, and the app's full-width ink button pinned
 * to the bottom (on a desktop it sits under the fields instead).
 */
export function EditorBody({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-xl flex-col gap-7 px-5 pb-40 pt-2 font-th-sans lg:pb-10">{children}</div>;
}

export function EditorFooter({
  label,
  onClick,
  enabled = true,
  busy = false,
  secondary,
}: {
  label: string;
  onClick: () => void;
  enabled?: boolean;
  busy?: boolean;
  secondary?: { label: string; onClick: () => void };
}) {
  const on = enabled && !busy;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-2 font-th-sans lg:static lg:mx-auto lg:max-w-xl lg:bg-transparent lg:pb-0">
      {secondary && (
        <button type="button" onClick={secondary.onClick} disabled={busy} className="mx-auto block py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-th-ink disabled:text-[#999999]">
          {secondary.label}
        </button>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={!on}
        className={`w-full rounded-[30px] py-[17px] text-[14px] font-semibold uppercase tracking-[0.07em] text-white transition-colors ${on ? "bg-[#1A1A1A] hover:bg-black" : "bg-[#D6D6D6]"}`}
      >
        {busy ? "saving…" : label}
      </button>
    </div>
  );
}

/** Which collections a piece belongs to: a row per collection, ticked. */
export function CollectionChecklist({
  collections,
  selected,
  onChange,
}: {
  collections: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  if (collections.length === 0) return <p className="text-[13px] text-th-muted">no collections yet — make one from the collections tab.</p>;
  return (
    <div className="flex flex-col divide-y divide-[#F0F0F0] rounded-2xl border border-[#EBEBEB]">
      {collections.map((c) => {
        const on = selected.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onChange(on ? selected.filter((x) => x !== c.id) : [...selected, c.id])}
            className="flex items-center justify-between px-4 py-3 text-left text-[15px] text-th-ink"
          >
            <span className="truncate">{c.name}</span>
            <span className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[12px] ${on ? "border-[#1A1A1A] bg-[#1A1A1A] text-white" : "border-[#D6D6D6]"}`}>{on ? "✓" : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A labelled on/off switch. */
export function Toggle({ label, detail, on, onChange }: { label: string; detail?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-[15px] text-th-ink">{label}</span>
        {detail && <span className="mt-0.5 block text-[12px] text-th-muted">{detail}</span>}
      </span>
      <span className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? "bg-[#1A1A1A]" : "bg-[#E5E5E5]"}`}>
        <span className={`absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-[left] ${on ? "left-[22px]" : "left-[2px]"}`} />
      </span>
    </button>
  );
}

/** Dollars in, number or null out. */
export function parseMoney(v: string): number | null {
  const n = parseFloat(v.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : null;
}
