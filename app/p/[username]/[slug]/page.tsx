import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSharedPiece } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { getUser } from "@/lib/auth";
import { VisitorFrame, OwnerPreview } from "@/components/visitor/VisitorFrame";
import { PieceSheet } from "@/components/visitor/PieceSheet";
import { AppNudge } from "@/components/visitor/GetTheApp";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";

/**
 * A single piece, shared by link.
 *
 * /p/ rather than /vault/<user>/<id>: that path is the owner's own screen and
 * depends on being signed in as them. This one shows only what shared_piece()
 * returns for the token in the URL, to whoever is holding it.
 */

interface Props {
  params: { username: string; slug: string };
  searchParams: { k?: string; preview?: string };
}

const WEB_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://threadology.vercel.app";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const result = await getSharedPiece(searchParams.k);
  const robots = { index: false, follow: false };

  if (result.kind !== "ok") return { title: "threadology", robots };

  const { owner, piece } = result.data;
  const title = `${piece.name ?? piece.type} — @${owner.username}`;
  const description = [piece.brand, piece.year, piece.size].filter(Boolean).join(" · ");
  const image = `${WEB_ORIGIN}/og/piece/${searchParams.k}`;

  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedPiecePage({ params, searchParams }: Props) {
  const [result, viewer] = await Promise.all([getSharedPiece(searchParams.k), getUser()]);
  const signedIn = !!viewer;

  if (result.kind === "unavailable") {
    return (
      <VisitorFrame signedIn={signedIn}>
        <DeadLink />
      </VisitorFrame>
    );
  }

  if (result.kind === "password") {
    return (
      <VisitorFrame signedIn={signedIn}>
        <PasswordChallenge fn="shared_piece" token={searchParams.k!} kind="piece" />
      </VisitorFrame>
    );
  }

  const { owner, piece } = result.data;
  const isOwner = await viewerIsOwner(params.username);
  const ownHref = `/pieces/${piece.id}`;
  if (isOwner && searchParams.preview !== "1") redirect(ownHref);

  return (
    <VisitorFrame signedIn={signedIn} banner={isOwner ? <OwnerPreview href={ownHref} /> : undefined}>
      <PieceSheet piece={piece} owner={owner.username} inline />
      {!signedIn && (
        <div className="px-5">
          <AppNudge line={`@${owner.username} keeps their archive on threadology.`} />
        </div>
      )}
    </VisitorFrame>
  );
}
