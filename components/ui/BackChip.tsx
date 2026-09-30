"use client";

import { ChipButton } from "./ChipButton";
import { useBack } from "./useBack";

/** The back chip: to where you came from, or `fallback` when you arrived fresh. */
export function BackChip({ fallback, onMedia = false }: { fallback: string; onMedia?: boolean }) {
  const back = useBack(fallback);
  return <ChipButton icon="chevron-left" label="back" onClick={back} onMedia={onMedia} />;
}
