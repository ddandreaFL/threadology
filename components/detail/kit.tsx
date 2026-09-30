"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

/**
 * The detail-page kit, the web's copy of threadology-native/components/
 * detail/kit.tsx (design handoff "Piece & Fit Detail Pages", 2026-09-28).
 * Piece detail and fit detail are both built from these parts; only the
 * order and the emphasis differ. A phone gets the app's layout; a desktop
 * puts the photo in a sticky 640px column and the page beside it.
 */

// ── Layout ──────────────────────────────────────────────────────────────────

export function DetailLayout({ media, toolbar, children }: { media: ReactNode; toolbar: ReactNode; children: ReactNode }) {
  return (
    // Sized by its container, not the window: the same page lays out as a
    // full screen or inside the slide-over panel.
    <div className="@container font-th-sans text-th-ink">
      <div className="@3xl:grid @3xl:grid-cols-2 @3xl:items-start @5xl:grid-cols-[40rem_minmax(0,1fr)]">
        {/* Wide: back top-left, the rest top-right — where every screen's
            header chips sit, so back does not jump across the page. */}
        <div className="hidden items-center justify-between px-5 pb-3.5 pt-[0.9375rem] @3xl:col-span-2 @3xl:flex">{toolbar}</div>
        <div className="relative @3xl:sticky @3xl:top-0 @3xl:px-8 @3xl:pb-8">{media}</div>
        <div className="pb-12 @3xl:max-w-[37.5rem] @3xl:pb-12 @3xl:pl-8 @3xl:pr-16">{children}</div>
      </div>
    </div>
  );
}

// ── 1. Hero ─────────────────────────────────────────────────────────────────

/**
 * The photo: full bleed on a phone with the chips floating on it, a rounded
 * card on a desktop. Swipes on a phone; on a desktop a piece shows a row of
 * thumbnails under it instead.
 */
export function DetailHero({
  photos,
  alt,
  aspect,
  chips,
  counter = false,
  thumbs = false,
  placeholder,
  overlay,
}: {
  photos: string[];
  alt: string;
  /** Tailwind aspect class: aspect-[4/5] for a piece, aspect-[3/4] for a fit. */
  aspect: string;
  /** Phone only: back, share, more — floating on the photo. */
  chips: ReactNode;
  counter?: boolean;
  thumbs?: boolean;
  placeholder?: string;
  /** Phone only: the fit's scrim and title. */
  overlay?: ReactNode;
}) {
  const [i, setI] = useState(0);
  const strip = useRef<HTMLDivElement>(null);
  const go = (n: number) => {
    setI(n);
    const el = strip.current;
    if (el) el.scrollTo({ left: n * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div>
      <div className={`relative w-full overflow-hidden bg-th-surface @3xl:rounded-th-card ${aspect}`}>
        {photos.length > 0 ? (
          <div
            ref={strip}
            className="flex h-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          >
            {photos.map((src, n) => (
              <div key={`${src}-${n}`} className="h-full w-full shrink-0 snap-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={n === 0 ? alt : ""} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3.5">
            <span className="text-[2rem] text-th-muted">✦</span>
            {placeholder && <span className="th-label">{placeholder}</span>}
          </div>
        )}
        {overlay && <div className="@3xl:hidden">{overlay}</div>}
        {counter && photos.length > 1 && (
          <span
            aria-label={`Photo ${i + 1} of ${photos.length}`}
            className="th-glass th-label absolute bottom-4 left-5 flex h-7 items-center whitespace-nowrap rounded-th-chip px-3 !text-th-ink @3xl:hidden"
          >
            {i + 1} / {photos.length}
          </span>
        )}
        <div className="absolute left-5 right-5 top-[calc(env(safe-area-inset-top)+1rem)] flex justify-between @3xl:hidden">{chips}</div>
      </div>
      {thumbs && photos.length > 1 && (
        <div className="mt-3 hidden gap-2 @3xl:flex">
          {photos.map((src, n) => (
            <button
              key={`${src}-${n}`}
              type="button"
              onClick={() => go(n)}
              aria-label={`Photo ${n + 1}`}
              className={`h-20 w-16 overflow-hidden rounded-th-inline-chip border-2 ${n === i ? "border-th-ink" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** The fit's phone hero overlay: the scrim, and the identity set on it. */
export function HeroScrim({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-[linear-gradient(to_bottom,rgba(27,26,23,0)_40%,rgba(27,26,23,0.72)_100%)] pb-7">
      {children}
    </div>
  );
}

/** A 44px chip: glass on a photo (phone), solid in the desktop toolbar. */
export function DetailChip({ icon, label, href, onClick, glass = false }: { icon: IconName; label: string; href?: string; onClick?: () => void; glass?: boolean }) {
  const cls = `inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-th-chip text-th-ink transition-colors ${
    glass ? "th-glass hover:bg-th-chip-pressed" : "bg-th-chip hover:bg-th-chip-pressed"
  }`;
  return href ? (
    <Link href={href} aria-label={label} className={cls}>
      <Icon name={icon} size={21} />
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} className={cls}>
      <Icon name={icon} size={21} />
    </button>
  );
}

/** The ··· chip and its menu: share, edit, delete (and private, on a piece). */
export function MoreMenu({ glass = false, items }: { glass?: boolean; items: { label: string; onClick?: () => void; href?: string; danger?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <DetailChip icon="overflow" label="More" glass={glass} onClick={() => setOpen((v) => !v)} />
      {open && (
        <div className="absolute right-0 top-12 z-20 w-52 overflow-hidden rounded-th-chip border border-th-border bg-white py-1 shadow-lg">
          {items.map((it) =>
            it.href ? (
              <Link key={it.label} href={it.href} className="block px-4 py-2.5 text-[0.875rem] hover:bg-th-surface">
                {it.label}
              </Link>
            ) : (
              <button
                key={it.label}
                type="button"
                onClick={() => (setOpen(false), it.onClick?.())}
                className={`block w-full px-4 py-2.5 text-left text-[0.875rem] hover:bg-th-surface ${it.danger ? "text-th-danger" : ""}`}
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ── 2. Identity ─────────────────────────────────────────────────────────────

export function Identity({ eyebrow, title, sub, onPhoto = false, children }: { eyebrow: string; title: string; sub?: string | null; onPhoto?: boolean; children?: ReactNode }) {
  return (
    <div className="px-5 @3xl:px-0">
      <p className={`th-label ${onPhoto ? "!text-white" : "!text-th-accent"}`}>{eyebrow}</p>
      <h1 className={`mt-1.5 text-[1.75rem] font-bold leading-8 tracking-[-0.035rem] [text-wrap:pretty] @3xl:text-[2.125rem] @3xl:leading-[2.375rem] ${onPhoto ? "text-white" : ""}`}>{title}</h1>
      {sub && <p className="mt-1.5 text-[0.875rem] leading-5 text-th-muted">{sub}</p>}
      {children}
    </div>
  );
}

export function PrivateBadge() {
  return (
    <div className="mt-3.5 flex items-center gap-2.5">
      <span className="th-label inline-flex h-6 items-center gap-1.5 rounded-th-inline-chip bg-th-ink px-2.5 !text-white">
        <Icon name="lock" size={13} /> private
      </span>
      <span className="text-[0.8125rem] leading-[1.0625rem] text-th-muted">hidden from every shared link</span>
    </div>
  );
}

// ── 3. Section ──────────────────────────────────────────────────────────────

export function Section({
  label,
  meta,
  action,
  bleed = false,
  children,
}: {
  label: string;
  meta?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  bleed?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between px-5 @3xl:px-0">
        <h2 className="th-label">{label}</h2>
        {action ? (
          action.href ? (
            <Link href={action.href} className="text-[0.8125rem] font-medium leading-[1.0625rem] text-th-accent hover:underline">
              {action.label}
            </Link>
          ) : (
            <button type="button" onClick={action.onClick} className="text-[0.8125rem] font-medium leading-[1.0625rem] text-th-accent hover:underline">
              {action.label}
            </button>
          )
        ) : meta ? (
          <span className="th-label">{meta}</span>
        ) : null}
      </div>
      <div className={bleed ? "@3xl:px-0" : "px-5 @3xl:px-0"}>{children}</div>
    </section>
  );
}

// ── 4. Record grid ──────────────────────────────────────────────────────────

export type RecordCell = { label: string; value: string | null | undefined; addHref?: string };

/**
 * Label over value, two to a row. The owner sees every field ("+ add" where
 * one is empty); a visitor sees only the filled ones, the last spanning both
 * columns when the count is odd.
 */
export function RecordGrid({ cells, owner }: { cells: RecordCell[]; owner: boolean }) {
  const shown = owner ? cells : cells.filter((c) => !!c.value);
  if (shown.length === 0) return null;
  return (
    <div className="grid grid-cols-2 border-t border-th-border">
      {shown.map((c, n) => {
        const left = n % 2 === 0;
        const span = left && n === shown.length - 1;
        return (
          <div
            key={c.label}
            className={`min-h-16 border-b border-th-border pb-3.5 pt-3 ${span ? "col-span-2" : left ? "border-r pr-4" : "pl-4"}`}
          >
            <p className="th-label">{c.label}</p>
            <div className="mt-1">{c.value ? <p className="break-words text-[1rem] font-medium leading-[1.375rem]">{c.value}</p> : <AddInline href={c.addHref} />}</div>
          </div>
        );
      })}
    </div>
  );
}

function AddInline({ href }: { href?: string }) {
  const inner = (
    <>
      <Icon name="plus" size={14} /> add
    </>
  );
  const cls = "inline-flex items-center gap-1.5 text-[1rem] font-medium leading-[1.375rem] text-th-accent";
  return href ? (
    <Link href={href} className={`${cls} hover:underline`}>
      {inner}
    </Link>
  ) : (
    <span className={cls}>{inner}</span>
  );
}

/** Estimated value — the owner's alone; never rendered for anyone else. */
export function OwnerValue({ value, addHref }: { value: number | null; addHref: string }) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-th-chip bg-th-surface px-4 pb-3.5 pt-3">
      <div>
        <p className="th-label">est. value</p>
        <div className="mt-1">{value != null ? <p className="text-[1rem] font-medium leading-[1.375rem]">${value.toLocaleString()}</p> : <AddInline href={addHref} />}</div>
      </div>
      <span className="flex items-center gap-1.5 text-[0.8125rem] text-th-muted">
        <Icon name="lock" size={14} /> only you
      </span>
    </div>
  );
}

// ── 5. Linked rows ──────────────────────────────────────────────────────────

export function RowList({ children }: { children: ReactNode }) {
  return <ul className="border-t border-th-border">{children}</ul>;
}

export function LinkedRow({ index, photo, title, sub, href }: { index?: number; photo: string | null | undefined; title: string; sub: string; href?: string }) {
  const inner = (
    <>
      {index != null && <span className="th-label w-[1.125rem] shrink-0">{String(index).padStart(2, "0")}</span>}
      <Thumb src={photo} className="h-14 w-14 rounded-th-inline-chip" />
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 block text-[1rem] font-medium leading-[1.3125rem]">{title}</span>
        {sub && <span className="block truncate text-[0.8125rem] leading-[1.0625rem] text-th-muted">{sub}</span>}
      </span>
      {href && <Icon name="chevron-right" size={16} className="shrink-0 text-th-muted" />}
    </>
  );
  const cls = "flex min-h-20 items-center gap-3.5 py-3";
  return (
    <li className="border-b border-th-border">
      {href ? (
        <Link href={href} className={`${cls} transition-colors hover:bg-th-surface`}>
          {inner}
        </Link>
      ) : (
        <div className={cls}>{inner}</div>
      )}
    </li>
  );
}

export function Thumb({ src, className }: { src: string | null | undefined; className: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className={`shrink-0 bg-th-surface object-cover ${className}`} />
  ) : (
    <span className={`flex shrink-0 items-center justify-center bg-th-surface text-[0.875rem] text-th-muted ${className}`}>✦</span>
  );
}

// ── 6. Strip ────────────────────────────────────────────────────────────────

export type StripItem = { id: string; photo: string | null | undefined; title: string; date: string | null; href: string };

export function Strip({ items }: { items: StripItem[] }) {
  return (
    <div className="flex gap-3 overflow-x-auto px-5 [scrollbar-width:none] @3xl:flex-wrap @3xl:overflow-visible @3xl:px-0 [&::-webkit-scrollbar]:hidden">
      {items.map((it) => (
        <Link key={it.id} href={it.href} className="w-[7.5rem] shrink-0 hover:opacity-85">
          <Thumb src={it.photo} className="h-40 w-[7.5rem] rounded-th-chip" />
          <p className="mt-2 truncate text-[0.875rem] font-medium leading-[1.1875rem]">{it.title}</p>
          {it.date && <p className="th-label mt-0.5">{shortDate(it.date)}</p>}
        </Link>
      ))}
    </div>
  );
}

// ── 7. Long text ────────────────────────────────────────────────────────────

export function LongText({ text }: { text: string }) {
  return (
    <div className="space-y-4 border-l-2 border-th-accent pl-[1.125rem]">
      {text
        .split(/\n\s*\n/)
        .filter((p) => p.trim())
        .map((p, n) => (
          <p key={n} className="whitespace-pre-wrap text-[1rem] leading-[1.625rem]">
            {p.trim()}
          </p>
        ))}
    </div>
  );
}

// ── 8. Empty prompts (owner only) ───────────────────────────────────────────

export function EmptyPrompt({ title, hint, href }: { title: string; hint: string; href: string }) {
  return (
    <Link href={href} className="flex min-h-16 items-center gap-3.5 rounded-th-chip border border-dashed border-th-chip-pressed py-2.5 pl-2.5 pr-4 transition-colors hover:bg-th-surface">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-th-chip bg-th-chip text-th-accent">
        <Icon name="plus" size={18} />
      </span>
      <span>
        <span className="block text-[1rem] font-medium leading-[1.3125rem] text-th-accent">{title}</span>
        <span className="block text-[0.8125rem] leading-[1.0625rem] text-th-muted">{hint}</span>
      </span>
    </Link>
  );
}

// ── Collections ─────────────────────────────────────────────────────────────

export function CollectionChips({ items, onAdd }: { items: { id: string; name: string; href?: string }[]; onAdd?: () => void }) {
  const chip = "inline-flex h-9 items-center whitespace-nowrap rounded-th-inline-chip px-3.5 text-[0.875rem] font-medium";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((c) =>
        c.href ? (
          <Link key={c.id} href={c.href} className={`${chip} bg-th-chip text-th-accent hover:bg-th-chip-pressed`}>
            {c.name.toLowerCase()}
          </Link>
        ) : (
          <span key={c.id} className={`${chip} bg-th-chip text-th-accent`}>
            {c.name.toLowerCase()}
          </span>
        )
      )}
      {onAdd && (
        <button type="button" onClick={onAdd} className={`${chip} gap-1.5 border border-dashed border-th-chip-pressed font-normal text-th-muted hover:text-th-ink`}>
          <Icon name="plus" size={14} /> {items.length ? "add" : "add to a collection"}
        </button>
      )}
    </div>
  );
}

// ── Dates and joins ─────────────────────────────────────────────────────────

// A bare YYYY-MM-DD is a calendar day; parsed as UTC it would land on the
// previous day anywhere west of Greenwich.
function toDate(d: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(`${d}T12:00:00`) : new Date(d);
}
export const shortDate = (d: string) => toDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const longDate = (d: string) => toDate(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const dayDate = (d: string) => `${toDate(d).toLocaleDateString("en-US", { weekday: "short" })} · ${longDate(d)}`;
export const dotted = (...parts: (string | null | undefined)[]) => parts.filter(Boolean).join(" · ");
