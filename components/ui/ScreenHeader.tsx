import type { ReactNode } from "react";
import { ChipButton, type ChipDescriptor } from "./ChipButton";

/**
 * The one header (threadology-native/components/chrome/ScreenHeader.tsx): a
 * lowercase title, an optional subtitle, at most two chips, and a back or
 * close chip leading. No fill, no divider — content scrolls under it.
 *
 * `titleSize` is "screen" (28pt, the app's) by default; desktop pages may
 * pass "display" for a larger title in the wider layout.
 */
export function ScreenHeader({
  title,
  subtitle,
  subtitleStyle = "metadata",
  actions = [],
  back,
  close,
  trailing,
}: {
  title: string;
  subtitle?: string;
  subtitleStyle?: "metadata" | "brandLine";
  /** 0 to 2 chips. */
  actions?: ChipDescriptor[];
  /** A back chip: where it goes. */
  back?: { href?: string; onClick?: () => void };
  /** A close chip, for modal screens. */
  close?: { href?: string; onClick?: () => void };
  trailing?: ReactNode;
}) {
  const leading = close
    ? { icon: "close" as const, label: "close", ...close }
    : back
      ? { icon: "chevron-left" as const, label: "back", ...back }
      : null;
  return (
    <header className="flex items-start gap-2 px-5 pb-3.5 pt-[15px] font-th-sans">
      {leading && <ChipButton {...leading} />}
      <div className="flex min-h-11 min-w-0 flex-1 flex-col gap-1.5">
        <h1 className="line-clamp-2 text-[28px] font-bold leading-8 tracking-[-0.02em] text-th-ink">{title}</h1>
        {subtitle ? (
          <p
            className={
              subtitleStyle === "brandLine"
                ? "truncate font-th-mono text-[11px] uppercase leading-[15px] tracking-[0.1em] text-th-muted"
                : "truncate text-[13px] leading-[17px] tracking-[-0.01em] text-th-muted"
            }
          >
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions.slice(0, 2).map((a) => (
        <ChipButton key={a.label} {...a} />
      ))}
      {trailing}
    </header>
  );
}
