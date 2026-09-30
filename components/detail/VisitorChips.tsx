"use client";

import { useBack } from "@/components/ui/useBack";
import { DetailChip } from "./kit";

/**
 * A visitor's chips: back, if there is somewhere to go back to, and share —
 * the system sheet on a phone, the link copied on a desktop.
 */
export function VisitorChips({ glass, extra }: { glass: boolean; extra?: React.ReactNode }) {
  const back = useBack("/");
  async function share() {
    const url = window.location.href;
    if (navigator.share) return navigator.share({ url }).catch(() => {});
    await navigator.clipboard?.writeText(url).catch(() => {});
  }
  return (
    <>
      <DetailChip icon="chevron-left" label="Back" glass={glass} onClick={back} />
      <span className="flex gap-2">
        {extra}
        <DetailChip icon="share" label="Share" glass={glass} onClick={share} />
      </span>
    </>
  );
}
