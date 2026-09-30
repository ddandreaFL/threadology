"use client";

import { useEffect, useRef, useState } from "react";
import { Chip, ChipRow } from "@/components/ui/Chip";
import { Icon } from "@/components/ui/Icon";
import { COUNTRIES, SUBCATEGORIES, TYPE_OPTIONS, packType, parseType } from "./options";
import { compressImage } from "@/lib/compress";
import { uploadImage } from "@/lib/storage";

/** Label over a field, as the app sets it. */
export function Field({ label, children, name }: { label: string; children: React.ReactNode; name?: string }) {
  return (
    <div className="flex flex-col gap-2 scroll-mt-24" id={name ? `field-${name}` : undefined}>
      <span className="text-[0.6875rem] text-[#999999]">{label}</span>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full border-b border-[#E8E8E8] bg-transparent pb-2 pt-1 text-[1rem] text-th-ink outline-none placeholder:text-[#C8C8C8] focus:border-th-ink";

/** Category, then its subcategories — the add flow's type step, compact. */
export function TypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { category, subcategory } = parseType(value);
  const cats = TYPE_OPTIONS.map((t) => t.id);
  const all = category && !cats.includes(category) ? [category, ...cats] : cats;
  const subs = SUBCATEGORIES[category] ?? [];
  const subsAll = subcategory && !subs.includes(subcategory) ? [subcategory, ...subs] : subs;
  const label = (id: string) => TYPE_OPTIONS.find((t) => t.id === id)?.label ?? id.toLowerCase();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {all.map((c) => (
          <Chip key={c} label={label(c)} selected={category === c} onClick={() => category !== c && onChange(c)} />
        ))}
      </div>
      {subsAll.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {subsAll.map((s) => (
            <Chip key={s} label={s.toLowerCase()} selected={subcategory === s} onClick={() => onChange(packType(category, subcategory === s ? null : s))} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Search narrows the list; a country missing from it is one tap away. */
export function MadeInPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [q, setQ] = useState("");
  const query = q.trim();
  const options = value && !COUNTRIES.includes(value) ? [value, ...COUNTRIES] : COUNTRIES;
  const filtered = query ? options.filter((c) => c.toLowerCase().includes(query.toLowerCase())) : options;
  const custom = query.length > 0 && !options.some((c) => c.toLowerCase() === query.toLowerCase());
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={value ?? "search countries"} className={`${inputClass} ${value ? "placeholder:text-th-ink" : ""}`} />
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {custom && <Chip label={`use "${query}"`} selected={false} onClick={() => (onChange(query), setQ(""))} />}
        {filtered.map((c) => (
          <Chip key={c} label={c} selected={value === c} onClick={() => (onChange(value === c ? null : c), setQ(""))} />
        ))}
      </div>
    </div>
  );
}

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => String(THIS_YEAR - i));
const ROW = 40;

/**
 * The year as a wheel, as in the app: the value stays text and the wheel
 * only ever writes four digits. Unset, it rests on 2000 in grey and writes
 * nothing until turned. Arrow keys step it on a desktop.
 */
export function YearWheel({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const set = YEARS.indexOf(value.trim());
  const legacy = value.trim() && set === -1 ? value.trim() : null;
  const start = set !== -1 ? set : YEARS.indexOf("2000");
  const ref = useRef<HTMLDivElement>(null);
  const touched = useRef(false);
  const [pos, setPos] = useState(start);

  useEffect(() => {
    if (ref.current) ref.current.scrollTop = start * ROW;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  function onScroll() {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, Math.min(YEARS.length - 1, Math.round(el.scrollTop / ROW)));
    setPos(i);
    if (!touched.current) return;
    if (settle.current) clearTimeout(settle.current);
    settle.current = setTimeout(() => YEARS[i] !== value && onChange(YEARS[i]), 120);
  }

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[0.6875rem] text-[#999999]">{legacy ? `year · saved as "${legacy}"` : set !== -1 ? "year" : "year · scroll to set"}</span>
        {value.trim() && (
          <button type="button" onClick={() => ((touched.current = false), onChange(""))} className="text-[0.75rem] font-medium text-th-accent">
            clear
          </button>
        )}
      </div>
      <div className="relative h-[12.5rem]">
        <div className="pointer-events-none absolute inset-x-0 top-20 h-10 border-y border-[#E8E8E8]" />
        <div
          ref={ref}
          tabIndex={0}
          onScroll={onScroll}
          onPointerDown={() => (touched.current = true)}
          onWheel={() => (touched.current = true)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
            e.preventDefault();
            touched.current = true;
            ref.current?.scrollBy({ top: e.key === "ArrowDown" ? ROW : -ROW, behavior: "smooth" });
          }}
          className="h-full snap-y snap-mandatory overflow-y-auto py-20 outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {YEARS.map((y, i) => {
            const d = Math.abs(i - pos);
            return (
              <div
                key={y}
                className="flex h-10 snap-center items-center justify-center text-[1.25rem] tabular-nums transition-[opacity,transform] duration-100"
                style={{ opacity: d === 0 ? 1 : d === 1 ? 0.45 : 0.2, transform: `scale(${d === 0 ? 1 : d === 1 ? 0.92 : 0.84})`, color: set !== -1 ? "#111111" : "#B8B8B8" }}
              >
                {y}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ChipRow };

export type PhotoItem = { url: string; file?: File };

/**
 * Photos: add from the device, remove, and tap one to make it the cover
 * (it moves to the front). New photos are compressed in the browser and
 * uploaded only on save, so an abandoned form leaves nothing in storage.
 */
export function PhotoPicker({ photos, onChange, max = 12 }: { photos: PhotoItem[]; onChange: (p: PhotoItem[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <div className="grid grid-cols-3 gap-2.5">
        {photos.map((p, i) => (
          <div key={p.url} className={`relative aspect-[3/4] overflow-hidden rounded-xl border-2 ${i === 0 ? "border-[#1A1A1A]" : "border-transparent"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt="" className="h-full w-full object-cover" onClick={() => onChange([p, ...photos.filter((_, j) => j !== i)])} />
            {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded bg-[#1A1A1A] px-1.5 py-0.5 text-[0.5625rem] font-bold uppercase tracking-wide text-white">cover</span>}
            <button
              type="button"
              aria-label="remove photo"
              onClick={() => onChange(photos.filter((_, j) => j !== i))}
              className="absolute right-1 top-1 flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full bg-black/60 text-[0.8125rem] font-bold text-white"
            >
              ×
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button type="button" onClick={() => input.current?.click()} className="flex aspect-[3/4] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#DEDEDE] text-th-muted hover:border-th-ink hover:text-th-ink">
            <Icon name="photos" size={24} />
            <span className="text-[0.75rem]">add photos</span>
          </button>
        )}
      </div>
      <p className="mt-2 text-[0.6875rem] text-[#999999]">{photos.length} / {max} · tap a photo to make it the cover</p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          const added = files.map((f) => ({ url: URL.createObjectURL(f), file: f }));
          onChange([...photos, ...added].slice(0, max));
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Uploads any new photos in order; returns the final URL list. */
export async function uploadPhotos(photos: PhotoItem[], userId: string): Promise<string[]> {
  const out: string[] = [];
  for (const p of photos) {
    if (!p.file) {
      out.push(p.url);
      continue;
    }
    const compressed = await compressImage(p.file);
    out.push(await uploadImage(compressed, userId));
  }
  return out;
}

/**
 * ?field=<name> comes from a "+ add" on a detail page: scroll that field into
 * view and put the cursor in it when it takes typing.
 */
export function useFocusField() {
  useEffect(() => {
    const name = new URLSearchParams(window.location.search).get("field");
    if (!name) return;
    const el = document.getElementById(`field-${name}`);
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ block: "center" });
      el.querySelector<HTMLInputElement | HTMLTextAreaElement>("input:not([type=hidden]), textarea")?.focus({ preventScroll: true });
    });
  }, []);
}
