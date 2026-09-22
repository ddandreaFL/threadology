import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSharedVault } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { SharedChrome, OwnerPreviewBanner } from "@/components/shared/shared-chrome";
import { SaveButton } from "@/components/shared/save-button";
import { SharedHeader } from "@/components/shared/shared-header";
import { SharedSegments } from "@/components/shared/shared-segments";
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
  const result = await getSharedVault(searchParams.k);

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
        <PasswordChallenge fn="shared_vault" token={searchParams.k!} kind="vault" />
      </SharedChrome>
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
    <SharedChrome>
      {isOwner && <OwnerPreviewBanner href="/vault" />}

      <SharedHeader
        owner={owner}
        title={`${owner.username}'s vault`}
        count={pieces.length}
        kind="vault"
      />

      <div className="mb-10 flex justify-center">
        <SaveButton containerType="vault" token={searchParams.k} label="save this vault" />
      </div>

      {pieces.length === 0 && collections.length === 0 && fits.length === 0 ? (
        <p className="py-24 text-center text-sm text-[#6B6358]">Nothing here yet.</p>
      ) : (
        <SharedSegments
          username={params.username}
          pieces={pieces}
          collections={collections}
          fits={fits}
        />
      )}
    </SharedChrome>
  );
}
