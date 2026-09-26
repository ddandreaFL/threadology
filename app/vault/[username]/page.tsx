import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSharedVault } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { getUser } from "@/lib/auth";
import { VisitorFrame, OwnerPreview } from "@/components/visitor/VisitorFrame";
import { SharedVault } from "@/components/visitor/SharedVault";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";

/**
 * A shared vault — the visitor state of the profile, per decision C1.
 *
 * This used to query users, pieces and collections directly, which is why it
 * rendered an empty profile to anyone who was not signed in: the blanket read
 * policy it depended on was dropped, and nothing replaced it. Everything now
 * comes from shared_vault(), so the page can only show what the token in the
 * URL entitles the viewer to, and private pieces never reach it at all.
 */

interface Props {
  params: { username: string };
  searchParams: { k?: string; preview?: string };
}

const WEB_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://threadology.vercel.app";

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const result = await getSharedVault(searchParams.k);

  // Unlisted has to mean unlisted: a link sent to one person must never
  // become a search result. A dead or gated link gives the unfurl nothing.
  const robots = { index: false, follow: false };

  if (result.kind !== "ok") {
    return { title: "threadology", robots };
  }

  const { owner, pieces } = result.data;
  const title = `@${owner.username}'s vault`;
  const description = `${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} documented.`;
  const image = `${WEB_ORIGIN}/og/vault/${searchParams.k}`;

  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedVaultPage({ params, searchParams }: Props) {
  const [result, viewer] = await Promise.all([getSharedVault(searchParams.k), getUser()]);
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
        <PasswordChallenge fn="shared_vault" token={searchParams.k!} kind="vault" />
      </VisitorFrame>
    );
  }

  const { owner, pieces, collections = [], fits = [] } = result.data;

  // An owner following their own link lands on their own vault, not on the
  // visitor view of it. ?preview=1 is the deliberate exception — the way to
  // check what the link actually shows.
  const isOwner = await viewerIsOwner(params.username);
  const previewing = searchParams.preview === "1";
  if (isOwner && !previewing) redirect("/vault");

  return (
    <VisitorFrame signedIn={signedIn} banner={isOwner ? <OwnerPreview href="/vault" /> : undefined}>
      <SharedVault
        username={owner.username}
        token={searchParams.k!}
        pieces={pieces}
        collections={collections}
        fits={fits}
        signedIn={signedIn}
      />
    </VisitorFrame>
  );
}
