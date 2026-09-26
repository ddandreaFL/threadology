import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSharedCollection } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { getUser } from "@/lib/auth";
import { VisitorFrame, OwnerPreview } from "@/components/visitor/VisitorFrame";
import { SharedBrowser } from "@/components/visitor/SharedBrowser";
import { AppNudge } from "@/components/visitor/GetTheApp";
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
  const [result, viewer] = await Promise.all([getSharedCollection(searchParams.k), getUser()]);
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
        <PasswordChallenge fn="shared_collection" token={searchParams.k!} kind="collection" />
      </VisitorFrame>
    );
  }

  const { owner, pieces, collection } = result.data;

  // The owner lands on the collection itself, not the collections list.
  const isOwner = await viewerIsOwner(params.username);
  const ownHref = collection ? `/collections/${collection.id}` : "/collections";
  if (isOwner && searchParams.preview !== "1") redirect(ownHref);

  const name = collection?.name ?? "collection";
  return (
    <VisitorFrame signedIn={signedIn} banner={isOwner ? <OwnerPreview href={ownHref} /> : undefined}>
      <SharedBrowser
        title={name}
        subtitle={`@${owner.username} · ${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"}`}
        owner={owner.username}
        pieces={pieces}
        save={{ type: "collection", token: searchParams.k!, label: "save this collection" }}
        galleryLabel={`@${owner.username} · ${name}`}
        footer={signedIn ? null : <div className="px-5"><AppNudge line={`Collections like "${name}" live in the app.`} /></div>}
      />
    </VisitorFrame>
  );
}
