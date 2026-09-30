"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { FitDetail } from "@/components/detail/FitDetail";
import { VisitorChips } from "@/components/detail/VisitorChips";
import type { SharedFitData } from "@/lib/shared";

/**
 * A shared fit, as the app shows one — the same page its owner sees, minus
 * who reacted, the views and anything to edit, plus reactions to tap.
 *
 * Opening it counts a view. That happens here, in the browser, rather than
 * on the server: a link unfurling in Messages fetches the page too, and a
 * preview is not a view.
 */
export function SharedFit({ data, token, save, nudge }: { data: SharedFitData; token: string; save: ReactNode; nudge?: ReactNode }) {
  const { fit, pieces, owner } = data;
  const counted = useRef(false);

  useEffect(() => {
    if (counted.current) return;
    counted.current = true;
    // The function ignores the owner; a failure (not yet deployed) is silent.
    supabase.rpc("record_fit_view" as never, { p_token: token } as never).then(
      () => {},
      () => {}
    );
  }, [token]);

  return (
    <FitDetail
      fit={{ id: fit.id, title: fit.title, caption: fit.caption, date: fit.date, location: fit.location ?? null, photos: fit.photos ?? [] }}
      pieces={[...pieces]
        .sort((a, b) => a.layer_order - b.layer_order)
        .map((p) => ({ id: p.id, brand: p.brand, type: p.type, name: p.name, year: p.year, size: p.size, photo: p.photos?.[0] ?? null }))}
      owner={false}
      byline={`@${owner.username}`}
      reactions={data.reactions ?? []}
      token={token}
      signedIn={!!data.viewer?.signed_in}
      chips={<VisitorChips glass />}
      toolbar={<VisitorChips glass={false} />}
      footer={
        <div className="px-5 @3xl:px-0">
          <div className="mt-8">{save}</div>
          {nudge}
        </div>
      }
    />
  );
}
