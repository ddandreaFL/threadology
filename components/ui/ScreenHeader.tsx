import type { ReactNode } from "react";
import { ChipButton, type ChipDescriptor } from "./ChipButton";
import { BackChip } from "./BackChip";

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
    <header className="flex items-start gap-2 px-5 pb-3.5 pt-[0.9375rem] font-th-sans">
      {back && !close && !back.onClick ? <BackChip fallback={back.href ?? "/profile"} /> : leading && <ChipButton {...leading} />}
      <div className="flex min-h-11 min-w-0 flex-1 flex-col gap-1.5">
        <h1 className="line-clamp-2 text-[1.75rem] font-bold leading-8 tracking-[-0.02em] text-th-ink">{keepEmojiAttached(title)}</h1>
        {subtitle ? (
          <p
            className={
              subtitleStyle === "brandLine"
                ? "truncate font-th-label font-light text-[0.6875rem] uppercase leading-[0.9375rem] tracking-[0.1em] text-th-muted"
                : "truncate text-[0.8125rem] leading-[1.0625rem] tracking-[-0.01em] text-th-muted"
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

/**
 * Collection names carry emoji ("tbl tees 🌳👕"). Left alone, a narrow header
 * wraps the emoji onto a line of their own. Non-breaking space before an
 * emoji run, and word joiners inside it, keep the run with the word before.
 */
// Built at runtime: the project's TypeScript target predates the `u` flag
// in regex literals, though every browser that runs this supports it.
const SPACE_BEFORE_EMOJI = new RegExp("\\s+(?=\\p{Extended_Pictographic})", "gu");
const BETWEEN_EMOJI = new RegExp("(\\p{Extended_Pictographic}\\uFE0F?)(?=\\p{Extended_Pictographic})", "gu");

function keepEmojiAttached(title: string): string {
  return title.replace(SPACE_BEFORE_EMOJI, "\u00A0").replace(BETWEEN_EMOJI, "$1\u2060");
}

