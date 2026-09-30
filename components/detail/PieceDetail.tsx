"use client";

import type { ReactNode } from "react";
import {
  CollectionChips,
  DetailHero,
  DetailLayout,
  EmptyPrompt,
  Identity,
  LongText,
  OwnerValue,
  PrivateBadge,
  RecordGrid,
  Section,
  Strip,
  longDate,
  type StripItem,
} from "./kit";

export type PieceDetailData = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  season: string | null;
  size: string | null;
  condition: string | null;
  made_in: string | null;
  story: string | null;
  photos: string[];
  is_private?: boolean;
  /** YYYY-MM-DD. */
  added_on: string | null;
};

/**
 * Piece detail — the archive record, for its owner or for someone holding a
 * link. The owner gets every field (with "+ add" on the empty ones), the
 * value panel, prompts for what's missing, and the private badge. A visitor
 * gets what is filled in, and nothing else.
 */
export function PieceDetail({
  piece,
  owner,
  estimatedValue = null,
  wornIn,
  collections,
  chips,
  toolbar,
  onManageCollections,
  footer,
  byline,
}: {
  piece: PieceDetailData;
  owner: boolean;
  estimatedValue?: number | null;
  wornIn: StripItem[];
  collections: { id: string; name: string; href?: string }[];
  /** Phone: the chips on the photo. */
  chips: ReactNode;
  /** Desktop: the same, as a toolbar row above the page. */
  toolbar: ReactNode;
  onManageCollections?: () => void;
  footer?: ReactNode;
  /** A visitor's eyebrow leads with whose piece this is. */
  byline?: string;
}) {
  const title = piece.name ?? piece.type;
  const edit = (field: string) => `/pieces/${piece.id}/edit?field=${field}`;

  return (
    <DetailLayout
      toolbar={toolbar}
      media={
        <DetailHero
          photos={piece.photos}
          alt={title}
          aspect="aspect-[4/5]"
          chips={chips}
          counter
          thumbs
          placeholder={owner ? "cover photo" : undefined}
        />
      }
    >
      <div className="pt-7 @3xl:pt-0">
        <Identity eyebrow={byline ? `${byline} · ${piece.brand}` : piece.brand} title={title} sub={piece.name ? piece.type : null}>
          {owner && piece.is_private ? <PrivateBadge /> : null}
        </Identity>
      </div>

      <Section label="record">
        <RecordGrid
          owner={owner}
          cells={[
            { label: "year", value: piece.year, addHref: edit("year") },
            { label: "season", value: piece.season, addHref: edit("season") },
            { label: "size", value: piece.size, addHref: edit("size") },
            { label: "condition", value: piece.condition, addHref: edit("condition") },
            { label: "made in", value: piece.made_in, addHref: edit("made_in") },
            { label: "added on", value: piece.added_on ? longDate(piece.added_on) : null },
          ]}
        />
        {owner && <OwnerValue value={estimatedValue} addHref={edit("value")} />}
      </Section>

      {piece.story ? (
        <Section label="story" action={owner ? { label: "edit", href: edit("story") } : undefined}>
          <LongText text={piece.story} />
        </Section>
      ) : owner ? (
        <Section label="story">
          <EmptyPrompt title="write its story" hint="where it came from, why you keep it" href={edit("story")} />
        </Section>
      ) : null}

      {wornIn.length > 0 ? (
        <Section label="worn in" meta={`${wornIn.length} ${wornIn.length === 1 ? "fit" : "fits"}`} bleed>
          <Strip items={wornIn} />
        </Section>
      ) : owner ? (
        <Section label="worn in">
          <EmptyPrompt title="not in a fit yet" hint="tag this piece when you log a fit" href="/fit/new" />
        </Section>
      ) : null}

      {(collections.length > 0 || owner) && (
        <Section label="collections" action={owner && collections.length > 0 ? { label: "manage", onClick: onManageCollections } : undefined}>
          <CollectionChips items={collections} onAdd={owner ? onManageCollections : undefined} />
        </Section>
      )}

      {footer}
    </DetailLayout>
  );
}
