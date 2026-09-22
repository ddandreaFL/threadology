import type { Metadata } from "next";
import { getSharedPiece } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { SharedChrome, OwnerPreviewBanner } from "@/components/shared/shared-chrome";
import { SharedPieceBody } from "@/components/shared/shared-piece-body";
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
  searchParams: { k?: string };
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
  const result = await getSharedPiece(searchParams.k);

  if (result.kind === "unavailable") {
    return (
      <SharedChrome>
        <DeadLink />
      </SharedChrome>
    );
  }

  if (result.kind === "password") {
    return (
      <SharedChrome>
        <PasswordChallenge fn="shared_piece" token={searchParams.k!} kind="piece" />
      </SharedChrome>
    );
  }

  // The owner's own view of a piece is the app, or their vault on the web, so
  // they are told what they are looking at rather than sent somewhere else.
  const isOwner = await viewerIsOwner(params.username);

  return (
    <SharedChrome>
      {isOwner && <OwnerPreviewBanner href="/vault" />}
      <SharedPieceBody data={result.data} />
    </SharedChrome>
  );
}
