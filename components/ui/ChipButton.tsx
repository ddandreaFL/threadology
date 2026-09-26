"use client";

import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/**
 * The app's chip button (threadology-native/components/chrome/ChipButton.tsx):
 * a 44pt square in headers, 32pt inside rows, stone fill, one icon, an
 * optional unread dot. A link when given `href`, a button otherwise.
 */
export type ChipDescriptor = {
  icon: IconName;
  /** Accessible label — there is no visible text to fall back on. */
  label: string;
  onClick?: () => void;
  href?: string;
  badge?: boolean;
};

export function ChipButton({
  icon,
  label,
  onClick,
  href,
  badge = false,
  size = "header",
  primary = false,
  onMedia = false,
  disabled = false,
}: ChipDescriptor & { size?: "header" | "inline"; primary?: boolean; onMedia?: boolean; disabled?: boolean }) {
  const box = size === "header" ? "h-11 w-11 rounded-th-chip" : "h-8 w-8 rounded-th-inline-chip";
  const fill = primary
    ? "bg-th-accent hover:bg-th-accent-pressed text-th-on-ink"
    : onMedia
      ? "bg-th-chip-on-media hover:bg-th-chip-pressed text-th-ink"
      : "bg-th-chip hover:bg-th-chip-pressed active:bg-th-chip-pressed text-th-ink";
  const iconSize = size === "header" ? 21 : 17;
  const className = `relative inline-flex shrink-0 items-center justify-center transition-colors ${box} ${fill} ${
    disabled ? "pointer-events-none opacity-50" : ""
  }`;
  const inner = (
    <>
      <Icon name={icon} size={iconSize} className={size === "inline" && !primary ? "text-th-muted" : undefined} />
      {badge && (
        <span
          className={`absolute right-[9px] top-[9px] h-2 w-2 rounded-full border-[1.5px] bg-th-accent ${
            onMedia ? "border-th-chip-on-media" : "border-th-chip"
          }`}
        />
      )}
    </>
  );
  return href ? (
    <Link href={href} aria-label={label} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" aria-label={label} onClick={onClick} disabled={disabled} className={className}>
      {inner}
    </button>
  );
}
