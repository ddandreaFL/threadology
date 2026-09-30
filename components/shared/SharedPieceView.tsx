import { redirect } from "next/navigation";
import { getSharedPiece } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { getUser } from "@/lib/auth";
import { VisitorFrame, OwnerPreview } from "@/components/visitor/VisitorFrame";
import { PieceDetail } from "@/components/detail/PieceDetail";
import { VisitorChips } from "@/components/detail/VisitorChips";
import { AppNudge } from "@/components/visitor/GetTheApp";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";
import { SaveButton } from "@/components/shared/save-button";

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
 * The page body, shared by the full page (app/p/[username]/[slug]/page.tsx) and the
 * slide-over (app/(main)/@panel/(.)p/[username]/[slug]).
 */
export async function SharedPieceView({ params, searchParams, inPanel = false }: Props & { inPanel?: boolean }) {
  const [result, viewer] = await Promise.all([getSharedPiece(searchParams.k), getUser()]);
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
        <PasswordChallenge fn="shared_piece" token={searchParams.k!} kind="piece" />
      </Frame>
    );
  }

  const { owner, piece, worn_in = [], collections = [] } = result.data;
  const isOwner = await viewerIsOwner(params.username);
  const ownHref = `/pieces/${piece.id}`;
  if (isOwner && searchParams.preview !== "1") redirect(ownHref);

  return (
    <Frame signedIn={signedIn} banner={isOwner ? <OwnerPreview href={ownHref} /> : undefined}>
      <PieceDetail
        piece={{ ...piece, photos: piece.photos ?? [], added_on: piece.created_at?.slice(0, 10) ?? null }}
        owner={false}
        byline={`@${owner.username}`}
        // Only fits and collections that are out by link themselves, each
        // opened through its own token.
        wornIn={worn_in.map((f) => ({
          id: f.id,
          title: f.title ?? "untitled fit",
          date: f.date,
          photo: f.photo,
          href: `/fit/${owner.username}/${f.slug}?k=${f.share_token}`,
        }))}
        collections={collections.map((c) => ({ id: c.id, name: c.name, href: `/vault/${owner.username}/c/${c.slug}?k=${c.share_token}` }))}
        chips={<VisitorChips glass />}
        toolbar={<VisitorChips glass={false} />}
        footer={
          <div className="px-5 @3xl:px-0">
            <div className="mt-8">
              <SaveButton containerType="piece" token={searchParams.k} label="save this piece" />
            </div>
            {!signedIn && <AppNudge line={`@${owner.username} keeps their archive on threadology.`} />}
          </div>
        }
      />
    </Frame>
  );
}
