import { redirect } from "next/navigation";
import { getSharedFit } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { getUser } from "@/lib/auth";
import { VisitorFrame, OwnerPreview } from "@/components/visitor/VisitorFrame";
import { SharedFit } from "@/components/visitor/SharedFit";
import { AppNudge } from "@/components/visitor/GetTheApp";
import { SaveButton } from "@/components/shared/save-button";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";

type Props = {
  params: { username: string; slug: string };
  searchParams: { k?: string; preview?: string };
};

function PanelFrame({ children, banner }: { signedIn: boolean; children: React.ReactNode; banner?: React.ReactNode }) {
  return (
    <>
      {banner}
      {children}
    </>
  );
}

/**
 * The page body, shared by the full page (app/fit/[username]/[slug]/page.tsx) and the
 * slide-over (app/(main)/@panel/(.)fit/[username]/[slug]).
 */
export async function SharedFitView({ params, searchParams, inPanel = false }: Props & { inPanel?: boolean }) {
  const [result, viewer] = await Promise.all([getSharedFit(searchParams.k), getUser()]);
  const signedIn = !!viewer;
  // In the slide-over the page frame is already there: the content only.
  const Frame = inPanel ? PanelFrame : VisitorFrame;

  if (result.kind === "unavailable") {
    return (
      <Frame signedIn={signedIn}>
        <DeadLink />
      </Frame>
    );
  }

  if (result.kind === "password") {
    return (
      <Frame signedIn={signedIn}>
        <PasswordChallenge fn="shared_fit" token={searchParams.k!} kind="fit" />
      </Frame>
    );
  }

  // The web has an owner fit page now, so an owner following their own link
  // goes there — ?preview=1 still shows the visitor view.
  const isOwner = await viewerIsOwner(params.username);
  const ownHref = `/fits/${result.data.fit.id}`;
  if (isOwner && searchParams.preview !== "1") redirect(ownHref);

  return (
    <Frame signedIn={signedIn} banner={isOwner ? <OwnerPreview href={ownHref} /> : undefined}>
      <SharedFit
        data={result.data}
        token={searchParams.k!}
        save={<SaveButton containerType="fit" token={searchParams.k} label="save this fit" />}
        nudge={signedIn ? null : <AppNudge line="Log what you wear, in the app." />}
      />
    </Frame>
  );
}
