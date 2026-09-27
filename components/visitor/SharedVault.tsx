"use client";

import { useState } from "react";
import Link from "next/link";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SharedBrowser } from "./SharedBrowser";
import { AppNudge } from "./GetTheApp";
import type { SharedPiece } from "@/lib/shared";
import type { SharedCollectionSummary, SharedFitSummary } from "@/lib/shared";

/**
 * A shared vault: the owner's pieces, and — if they have shared them — their
 * collections and fits, as the app's profile segments them. Each collection
 * and fit opens through the token it was shared with.
 */
export function SharedVault({
  username,
  token,
  pieces,
  collections,
  fits,
  signedIn,
}: {
  username: string;
  token: string;
  pieces: SharedPiece[];
  collections: SharedCollectionSummary[];
  fits: SharedFitSummary[];
  signedIn: boolean;
}) {
  const segments = [
    { id: "pieces", label: `pieces · ${pieces.length}` },
    ...(collections.length ? [{ id: "collections", label: `collections · ${collections.length}` }] : []),
    ...(fits.length ? [{ id: "fits", label: `fits · ${fits.length}` }] : []),
  ];
  const [segment, setSegment] = useState("pieces");
  const nudge = signedIn ? null : <AppNudge line={`Start a vault like @${username}'s.`} />;

  const chips =
    segments.length > 1 ? (
      <div className="flex gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none]">
        {segments.map((s) => (
          <button
            key={s.id}
            onClick={() => setSegment(s.id)}
            aria-pressed={segment === s.id}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition-colors ${
              segment === s.id ? "bg-[#1A1A1A] text-white" : "border border-[#EBEBEB] text-[#999999] hover:text-th-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    ) : null;

  if (segment === "pieces") {
    return (
      <SharedBrowser
        title={`@${username}`}
        subtitle={`${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"}`}
        owner={username}
        pieces={pieces}
        save={{ type: "vault", token, label: "save this vault" }}
        galleryLabel={`@${username}`}
        above={chips}
        footer={<div className="px-5">{nudge}</div>}
      />
    );
  }

  return (
    <div>
      <ScreenHeader title={`@${username}`} subtitle={segment} />
      {chips}
      <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-6 px-3 md:grid-cols-3 lg:grid-cols-4 lg:px-8">
        {segment === "collections"
          ? collections.map((c) => (
              <Link key={c.id} href={`/vault/${username}/c/${c.slug}?k=${c.share_token}`} className="group block">
                <div className="grid aspect-square grid-cols-2 gap-0.5 overflow-hidden rounded-2xl bg-th-chip">
                  {[0, 1, 2, 3].map((i) =>
                    c.previews[i] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={c.previews[i]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span key={i} className="bg-th-surface" />
                    )
                  )}
                </div>
                <p className="mt-2 truncate text-[13px] font-medium">{c.name}</p>
                <p className="text-[11px] text-th-muted">
                  {c.piece_count} {c.piece_count === 1 ? "piece" : "pieces"}
                </p>
              </Link>
            ))
          : fits.map((f) => (
              <Link key={f.id} href={`/fit/${username}/${f.slug}?k=${f.share_token}`} className="group block">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-th-chip">
                  {f.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.photos[0]} alt={f.title ?? "fit"} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <p className="mt-2 truncate text-[13px] font-medium">{f.title || "untitled fit"}</p>
                {f.date && (
                  <p className="text-[11px] text-th-muted">
                    {new Date(f.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                )}
              </Link>
            ))}
      </div>
      <div className="px-5">{nudge}</div>
    </div>
  );
}
