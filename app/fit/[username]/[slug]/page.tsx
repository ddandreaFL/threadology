import type { Metadata } from "next";
import { getSharedFit } from "@/lib/shared";
import { viewerIsOwner } from "@/lib/shared-viewer";
import { SharedChrome, OwnerPreviewBanner } from "@/components/shared/shared-chrome";
import { PasswordChallenge } from "@/components/shared/password-challenge";
import { DeadLink } from "@/components/shared/dead-link";
import { SharedFitBody } from "@/components/shared/shared-fit-body";

/**
 * A shared fit on the web.
 *
 * The fallback half of a universal link: with the app installed iOS opens the
 * native viewer, and without it the browser lands here. Both read the same ?k=
 * token through shared_fit(), so a visitor sees the same fit either way.
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
  const result = await getSharedFit(searchParams.k);
  const robots = { index: false, follow: false };

  if (result.kind !== "ok") return { title: "threadology", robots };

  const { owner, fit, pieces } = result.data;
  const title = `${fit.title ?? "a fit"} — @${owner.username}`;
  const description =
    pieces.length > 0
      ? `${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} documented by @${owner.username}.`
      : `Documented by @${owner.username}.`;
  const image = `${WEB_ORIGIN}/og/fit/${searchParams.k}`;

  return {
    title,
    description,
    robots,
    openGraph: { title, description, images: [image], type: "website" },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function SharedFitPage({ params, searchParams }: Props) {
  const result = await getSharedFit(searchParams.k);

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
        <PasswordChallenge fn="shared_fit" token={searchParams.k!} kind="fit" />
      </SharedChrome>
    );
  }

  // A fit has no owner page on the web — the app is where you look at your
  // own — so an owner who lands here is told what they are looking at rather
  // than redirected somewhere that is not their fit.
  const isOwner = await viewerIsOwner(params.username);

  return (
    <SharedChrome>
      {isOwner && <OwnerPreviewBanner />}
      <SharedFitBody data={result.data} token={searchParams.k} />
    </SharedChrome>
  );
}
