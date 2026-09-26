import type { Metadata } from "next";
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

/**
 * A shared fit on the web.
 *
 * The fallback half of a universal link: with the app installed iOS opens the
 * native viewer, and without it the browser lands here. Both read the same ?k=
 * token through shared_fit(), so a visitor sees the same fit either way.
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
  const [result, viewer] = await Promise.all([getSharedFit(searchParams.k), getUser()]);
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
        <PasswordChallenge fn="shared_fit" token={searchParams.k!} kind="fit" />
      </VisitorFrame>
    );
  }

  // The web has an owner fit page now, so an owner following their own link
  // goes there — ?preview=1 still shows the visitor view.
  const isOwner = await viewerIsOwner(params.username);
  const ownHref = `/fits/${result.data.fit.id}`;
  if (isOwner && searchParams.preview !== "1") redirect(ownHref);

  return (
    <VisitorFrame signedIn={signedIn} banner={isOwner ? <OwnerPreview href={ownHref} /> : undefined}>
      <SharedFit
        data={result.data}
        token={searchParams.k!}
        save={<SaveButton containerType="fit" token={searchParams.k} label="save this fit" />}
        nudge={signedIn ? null : <AppNudge line="Log what you wear, in the app." />}
      />
    </VisitorFrame>
  );
}
