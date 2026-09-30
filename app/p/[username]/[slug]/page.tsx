import type { Metadata } from "next";
import { SharedPieceView } from "@/components/shared/SharedPieceView";
import { getSharedPiece } from "@/lib/shared";

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
export default async function SharedPiecePage(props: Props) {
  return <SharedPieceView {...props} />;
}
