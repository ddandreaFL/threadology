"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { PieceCard } from "@/components/ui/PieceCard";
import { Coverflow, type CoverflowHandle } from "@/components/coverflow/Coverflow";
import { useUnread } from "@/components/ui/useUnread";
import { useViewMode } from "./useViewMode";

export type OwnerFit = { id: string; title: string | null; photo: string | null; date: string | null; pieceCount: number };

const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "");
const meta = (f: OwnerFit) => [fmt(f.date), `${f.pieceCount} ${f.pieceCount === 1 ? "piece" : "pieces"}`].filter(Boolean).join("  ·  ");

/** Your fits — the app's fits tab: cover flow or grid, the bell up top. */
export function OwnerFits({ fits }: { fits: OwnerFit[] }) {
  const router = useRouter();
  const view = useViewMode("fits_view_mode");
  const unread = useUnread();
  const [index, setIndex] = useState(0);
  const cf = useRef<CoverflowHandle>(null);
  const active = fits[index];

  return (
    <div className="font-th-sans">
      <ScreenHeader
        title="fits"
        subtitle={`${fits.length} documented`}
        actions={[{ icon: "bell", label: unread ? "notifications, unread" : "notifications", href: "/notifications", badge: unread }, view.action]}
      />
      {fits.length === 0 ? (
        <div className="flex flex-col items-center px-10 py-24 text-center">
          <p className="text-[22px] italic text-[#555555]">Nothing documented yet.</p>
          <Link href="/fit/new" className="mt-6 rounded-th-pill bg-th-accent px-7 py-3.5 text-[14px] font-medium text-white">
            Log your first fit
          </Link>
        </div>
      ) : view.mode === "coverflow" ? (
        <div className="pt-4 lg:pt-8">
          <Coverflow
            ref={cf}
            items={fits.map((f) => ({ id: f.id, photo: f.photo, alt: f.title ?? "fit" }))}
            index={index}
            onIndexChange={setIndex}
            onCardClick={(i) => (i === index ? router.push(`/fits/${fits[i].id}`) : cf.current?.flyTo(i, "glide"))}
            maxCardWidth={400}
          />
          <div className="mt-4 px-5 text-center">
            <p className="truncate text-[16px] font-semibold tracking-[-0.3px] lg:text-[17px]">{active?.title || "untitled fit"}</p>
            <p className="mt-1 text-[12px] text-[#999999]">{active ? meta(active) : " "}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-3 gap-y-[22px] px-3 pt-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-5 lg:px-8">
          {fits.map((f) => (
            <PieceCard key={f.id} href={`/fits/${f.id}`} photo={f.photo} title={f.title || "untitled fit"} subtitle={meta(f)} aspect="portrait" />
          ))}
        </div>
      )}
    </div>
  );
}
