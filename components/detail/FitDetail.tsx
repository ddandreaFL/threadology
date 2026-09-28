"use client";

import type { ReactNode } from "react";
import {
  DetailHero,
  DetailLayout,
  EmptyPrompt,
  HeroScrim,
  Identity,
  LinkedRow,
  LongText,
  RecordGrid,
  RowList,
  Section,
  dayDate,
  dotted,
  longDate,
} from "./kit";
import { ReactionsSection, type Reaction, type Reactor } from "./Reactions";

export type FitDetailPiece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  size: string | null;
  photo: string | null;
  is_private?: boolean;
  href?: string;
};

export type FitDetailData = {
  id: string;
  title: string | null;
  caption: string | null;
  date: string | null;
  location: string | null;
  photos: string[];
  view_count?: number | null;
};

/**
 * Fit detail — the journal entry, for its owner or for someone holding the
 * link. On a phone the title sits on the photo over a scrim; a desktop has no
 * scrim, so the title moves into the column beside the photo.
 */
export function FitDetail({
  fit,
  pieces,
  owner,
  byline,
  reactions,
  reactors,
  token,
  signedIn,
  chips,
  toolbar,
  footer,
}: {
  fit: FitDetailData;
  pieces: FitDetailPiece[];
  owner: boolean;
  byline?: string;
  reactions: Reaction[];
  reactors?: Reactor[];
  token?: string;
  signedIn?: boolean;
  chips: ReactNode;
  toolbar: ReactNode;
  footer?: ReactNode;
}) {
  const eyebrow = dotted(byline, fit.date ? dayDate(fit.date) : null, fit.location) || " ";
  const title = fit.title || "untitled fit";
  const edit = (field?: string) => `/fits/${fit.id}/edit${field ? `?field=${field}` : ""}`;
  const hasPhoto = fit.photos.length > 0;

  return (
    <DetailLayout
      toolbar={toolbar}
      media={
        <DetailHero
          photos={fit.photos.slice(0, 1)}
          alt={title}
          aspect="aspect-[3/4]"
          chips={chips}
          overlay={
            hasPhoto ? (
              <HeroScrim>
                <Identity eyebrow={eyebrow} title={title} onPhoto />
              </HeroScrim>
            ) : undefined
          }
        />
      }
    >
      {/* The title below the photo: always on a desktop; on a phone only when
          there is no photo to set it on. */}
      <div className={`pt-7 lg:block lg:pt-0 ${hasPhoto ? "hidden" : ""}`}>
        <Identity eyebrow={eyebrow} title={title} />
      </div>

      {pieces.length > 0 ? (
        <Section label="what i wore" meta={`${pieces.length} ${pieces.length === 1 ? "piece" : "pieces"} · layer order`}>
          <RowList>
            {pieces.map((p, n) => (
              <LinkedRow
                key={p.id}
                index={n + 1}
                photo={p.photo}
                title={p.name ?? p.type}
                sub={dotted(p.brand, p.year, p.size) + (owner && p.is_private ? " · 🔒 private" : "")}
                href={p.href}
              />
            ))}
          </RowList>
        </Section>
      ) : owner ? (
        <Section label="what i wore">
          <EmptyPrompt title="add the pieces you wore" hint="pick from your wardrobe, in layer order" href={edit()} />
        </Section>
      ) : null}

      {fit.caption ? (
        <Section label="caption" action={owner ? { label: "edit", href: edit("caption") } : undefined}>
          <LongText text={fit.caption} />
        </Section>
      ) : owner ? (
        <Section label="caption">
          <EmptyPrompt title="add a caption" hint="where you were, who you were with" href={edit("caption")} />
        </Section>
      ) : null}

      <ReactionsSection owner={owner} initial={reactions} reactors={reactors} token={token} signedIn={signedIn} />

      <Section label="entry">
        <RecordGrid
          owner={owner}
          cells={[
            { label: "worn", value: fit.date ? longDate(fit.date) : null, addHref: edit("date") },
            { label: "where", value: fit.location, addHref: edit("location") },
            { label: "pieces", value: String(pieces.length) },
            ...(owner ? [{ label: "views", value: String(fit.view_count ?? 0) }] : []),
          ]}
        />
      </Section>

      {footer}
    </DetailLayout>
  );
}
