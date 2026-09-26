"use client";

import { useRef, useState } from "react";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { ChipButton } from "@/components/ui/ChipButton";
import { ChipRow } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { Icon, type IconName } from "@/components/ui/Icon";
import { PieceCard } from "@/components/ui/PieceCard";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";

// Stand-in photos: flat color cards, so the page needs no data.
const swatch = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},35%,62%)"/><stop offset="1" stop-color="hsl(${hue + 20},40%,38%)"/></linearGradient></defs><rect width="3" height="4" fill="url(#g)"/></svg>`
  )}`;
const ITEMS = Array.from({ length: 8 }, (_, i) => ({ id: String(i), photo: swatch(20 + i * 40), alt: `piece ${i + 1}` }));
const NAMES = ["Water Conservation Tee", "Adventure Tee", "Road Less Traveled Tee", "Collegiate Heritage Polo", "Retro Leaf Shirt", "Tan Weathergear Jacket", "Tattered Green Classic Tee", "Palm Tee"];

const ICONS: IconName[] = ["search", "grid", "coverflow", "plus", "pencil", "close", "chevron-left", "chevron-right", "expand", "camera", "photos", "overflow", "fits", "vault", "collections", "profile", "bell", "bell-off", "bookmark", "shuffle", "share", "previous", "next", "play", "pause", "gear"];

const COLORS: [string, string][] = [
  ["bg", "#FFFFFF"], ["surface", "#F7F6F3"], ["chip", "#F2F0EC"], ["chip-pressed", "#E5E2D9"], ["nav-pill", "#F4F2EE"],
  ["border", "#E8E5DE"], ["ink", "#1B1A17"], ["muted", "#6B6358"], ["accent", "#2D5A45"], ["danger", "#A33A2B"],
];

function Label({ children }: { children: string }) {
  return <p className="mb-3 mt-12 font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">{children}</p>;
}

export function FoundationDemo() {
  const [index, setIndex] = useState(0);
  const [view, setView] = useState<"coverflow" | "grid">("coverflow");
  const [season, setSeason] = useState<string | null>("fall/winter");
  const [sheet, setSheet] = useState<"light" | "dark" | null>(null);
  const cf = useRef<CoverflowHandle>(null);

  return (
    <div className="font-th-sans">
      <ScreenHeader
        title="vault"
        subtitle="8 pieces"
        actions={[
          { icon: "search", label: "search", onClick: () => {} },
          view === "coverflow"
            ? { icon: "grid", label: "show grid", onClick: () => setView("grid") }
            : { icon: "coverflow", label: "show cover flow", onClick: () => setView("coverflow") },
        ]}
      />

      <div className="mx-auto max-w-5xl">
        {view === "coverflow" ? (
          <>
            <Coverflow ref={cf} items={ITEMS} index={index} onIndexChange={setIndex} className="mt-6" />
            <div className="mt-4 text-center">
              <p className="text-[14px] font-semibold tracking-[-0.2px] text-th-ink">{NAMES[index]}</p>
              <p className="mt-0.5 text-[11px] text-[#999999]">Timberland</p>
              <div className="mt-4 flex justify-center gap-2">
                <button className="rounded-full bg-th-chip px-4 py-2 text-[13px]" onClick={() => cf.current?.flyTo(index - 1, "glide")}>glide ←</button>
                <button className="rounded-full bg-th-chip px-4 py-2 text-[13px]" onClick={() => cf.current?.flyTo(index + 1, "glide")}>glide →</button>
                <button className="rounded-full bg-th-chip px-4 py-2 text-[13px]" onClick={() => cf.current?.flyTo((index + 1 + Math.floor(Math.random() * 7)) % 8, "spin")}>spin</button>
                <button className="rounded-full bg-th-chip px-4 py-2 text-[13px]" onClick={() => cf.current?.flyTo(7, "drift", 2500)}>drift</button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] px-3 md:grid-cols-3 lg:grid-cols-4">
            {ITEMS.map((it, i) => (
              <PieceCard key={it.id} photo={it.photo} title={NAMES[i]} subtitle="Timberland" />
            ))}
          </div>
        )}

        <div className="px-5 pb-24">
          <Label>color</Label>
          <div className="grid grid-cols-5 gap-3 lg:grid-cols-10">
            {COLORS.map(([n, c]) => (
              <div key={n}>
                <div className="h-12 rounded-th-chip border border-th-border" style={{ background: c }} />
                <p className="mt-1 text-[11px] text-th-muted">{n}</p>
              </div>
            ))}
          </div>

          <Label>type</Label>
          <p className="text-[28px] font-bold leading-8 tracking-[-0.02em]">screen title</p>
          <p className="mt-2 text-[17px] font-bold tracking-[-0.01em]">section title</p>
          <p className="mt-2 text-[16px] font-medium">body</p>
          <p className="mt-2 text-[14px] text-th-muted">supporting</p>
          <p className="mt-2 text-[13px] leading-[17px] text-th-muted">metadata · 8 pieces</p>
          <p className="mt-2 font-th-mono text-[11px] uppercase tracking-[0.1em] text-th-muted">brand line · timberland</p>

          <Label>icons</Label>
          <div className="grid grid-cols-6 gap-4 lg:grid-cols-9">
            {ICONS.map((n) => (
              <div key={n} className="flex flex-col items-center gap-1">
                <Icon name={n} size={22} />
                <span className="text-[10px] text-th-muted">{n}</span>
              </div>
            ))}
          </div>

          <Label>chip buttons</Label>
          <div className="flex flex-wrap items-center gap-3">
            <ChipButton icon="search" label="search" onClick={() => {}} />
            <ChipButton icon="bell" label="notifications" badge onClick={() => {}} />
            <ChipButton icon="plus" label="add" primary onClick={() => {}} />
            <ChipButton icon="overflow" label="more" size="inline" onClick={() => {}} />
            <ChipButton icon="close" label="close" disabled />
          </div>

          <Label>headers</Label>
          <div className="rounded-th-card border border-th-border">
            <ScreenHeader title="tbl tees 🌳👕" subtitle="3 pieces" back={{ onClick: () => {} }} actions={[{ icon: "coverflow", label: "cover flow", onClick: () => {} }, { icon: "overflow", label: "more", onClick: () => {} }]} />
            <ScreenHeader title="edit piece" close={{ onClick: () => {} }} />
            <ScreenHeader title="Collegiate Heritage Polo" subtitle="Timberland · 1994" subtitleStyle="brandLine" back={{ onClick: () => {} }} />
          </div>

          <Label>choice chips</Label>
          <ChipRow options={["spring/summer", "fall/winter"]} value={season} onChange={setSeason} />

          <Label>sheets</Label>
          <div className="flex gap-3">
            <button className="rounded-full bg-th-chip px-4 py-2 text-[13px]" onClick={() => setSheet("light")}>light sheet</button>
            <button className="rounded-full bg-[#1A1A1A] px-4 py-2 text-[13px] text-white" onClick={() => setSheet("dark")}>dark sheet</button>
          </div>
        </div>
      </div>

      <Sheet open={sheet !== null} tone={sheet ?? "light"} title={sheet === "dark" ? "gallery" : "collections"} onClose={() => setSheet(null)}>
        <ChipRow options={["step", "drift", "off"]} value="step" onChange={() => {}} />
        <p className="mt-4 text-[13px] opacity-60">A sheet rises from the bottom on a phone and is a centered panel on a desktop.</p>
      </Sheet>
    </div>
  );
}
