import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSharedCollection } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { SharedChrome, OwnerPreviewBanner } from "@/components/shared/shared-chrome";
import { SaveButton } from "@/components/shared/save-button";
import { SharedHeader } from "@/components/shared/shared-header";
import { SharedPieces } from "@/components/shared/shared-pieces";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";

/**
 * A shared collection — the page a link most often lands on, since the first
 * thing anyone sends is a collection rather than a whole vault.
 *
 * Everything comes from shared_collection(), so this page cannot show what
 * the token does not entitle the viewer to. It does not query collections or
 * pieces directly, which is what the old version did and why it rendered
 * nothing for a stranger once the blanket read policy was dropped.
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
  const result = await getSharedCollection(searchParams.k);

  // Unlisted means unlisted. A shared link must never become a search result,
  // and a dead or gated link gives the unfurl nothing to show.
  const robots = { index: false, follow: false };

  if (result.kind !== "ok") {
    return { title: "threadology", robots };
  }

  const { owner, collection, pieces } = result.data;
  const title = `${collection?.name ?? "collection"} — @${owner.username}`;
  const description = `${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} documented by @${owner.username}.`;
  const image = `${WEB_ORIGIN}/og/collection/${searchParams.k}`;

  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedCollectionPage({ params, searchParams }: Props) {
  const result = await getSharedCollection(searchParams.k);

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
        <PasswordChallenge fn="shared_collection" token={searchParams.k!} kind="collection" />
      </SharedChrome>
    );
  }

  const { owner, collection, pieces } = result.data;

  // Same rule as the vault: your own link opens your own view of it.
  const isOwner = await viewerIsOwner(params.username);
  if (isOwner && searchParams.preview !== "1") redirect("/collections");

  return (
    <SharedChrome>
      {isOwner && <OwnerPreviewBanner href="/collections" />}

      <SharedHeader
        owner={owner}
        title={collection?.name ?? "collection"}
        count={pieces.length}
        kind="collection"
      />

      <div className="mb-10 flex justify-center">
        <SaveButton containerType="collection" token={searchParams.k} label="save this collection" />
      </div>

      <SharedPieces pieces={pieces} />
    </SharedChrome>
  );
}
