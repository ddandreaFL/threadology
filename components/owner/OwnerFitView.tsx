"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { ShareControl } from "@/components/sharing/share-control";
import { DetailChip, MoreMenu } from "@/components/detail/kit";
import { FitDetail, type FitDetailData, type FitDetailPiece } from "@/components/detail/FitDetail";
import type { Reaction, Reactor } from "@/components/detail/Reactions";
import { deleteFit } from "@/lib/actions/fits";
import type { ShareState } from "@/lib/share-state";

export type OwnerFitDetail = FitDetailData & {
  worn: FitDetailPiece[];
  reactions: Reaction[];
  reactors: Reactor[];
};

/**
 * One of your fits — the app's fit screen. The page is FitDetail; this holds
 * the share sheet and the ··· menu's actions.
 */
export function OwnerFitView({ fit, username, share }: { fit: OwnerFitDetail; username: string; share: ShareState }) {
  const router = useRouter();
  const [sharing, setSharing] = useState(false);

  async function remove() {
    if (!window.confirm("Delete this fit? Your pieces are not deleted.")) return;
    await deleteFit(fit.id);
    router.push("/fits");
    router.refresh();
  }

  const chips = (glass: boolean) => (
    <>
      <DetailChip icon="chevron-left" label="Back" href="/fits" glass={glass} />
      <span className="flex gap-2">
        <DetailChip icon="share" label="Share" onClick={() => setSharing(true)} glass={glass} />
        <MoreMenu
          glass={glass}
          items={[
            { label: "share", onClick: () => setSharing(true) },
            { label: "edit fit", href: `/fits/${fit.id}/edit` },
            { label: "delete fit", onClick: remove, danger: true },
          ]}
        />
      </span>
    </>
  );

  return (
    <>
      <FitDetail
        fit={fit}
        pieces={fit.worn}
        owner
        reactions={fit.reactions}
        reactors={fit.reactors}
        chips={chips(true)}
        toolbar={chips(false)}
      />
      <Sheet open={sharing} title="share fit" onClose={() => setSharing(false)}>
        <ShareControl type="fit" id={fit.id} username={username} initial={share} />
      </Sheet>
    </>
  );
}
