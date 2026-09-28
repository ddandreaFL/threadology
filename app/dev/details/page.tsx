import { notFound } from "next/navigation";
import { OwnerPieceView } from "@/components/owner/OwnerPieceView";
import { OwnerFitView } from "@/components/owner/OwnerFitView";
import { PieceDetail } from "@/components/detail/PieceDetail";
import { FitDetail } from "@/components/detail/FitDetail";
import { VisitorChips } from "@/components/detail/VisitorChips";

/**
 * The piece and fit detail pages with stand-in data — for reviewing the
 * redesign without signing in. Preview and local builds only.
 * ?v=sparse | full | private | visitor | fit | fitmin | fitvisitor
 */
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const share = { visibility: "private" as const, token: null, hasPassword: false, slug: null };
const JACKET = "/dev/jacket.jpg";
const SUGAR = "/dev/sugarhill.jpg";
const FLOWER = "/dev/flower.jpg";
const ago = (h: number) => new Date(Date.now() - h * 3600e3).toISOString();

const fullPiece = {
  id: "p",
  brand: "Arc'teryx",
  type: "Outerwear — Jacket",
  name: "Two-Tone Arc'teryx Weather Shell",
  year: "2011",
  season: "FW",
  size: "L",
  condition: "Fair",
  made_in: "Canada",
  story:
    "I believe I got this from grailed.. has served me well against the elements despite being well tenured - a whole in the left pocket and peeling left arm stash\n\nhigh mileage but still stealthy capable and stylish 🦕",
  photos: [JACKET, FLOWER, SUGAR, JACKET],
  added_on: "2026-09-12",
};
const wornIn = [
  { id: "a", photo: SUGAR, title: "Live from Sugarhill Supper Club & Disco", date: "2026-09-26", href: "#" },
  { id: "b", photo: null, title: "rainy commute", date: "2026-09-14", href: "#" },
  { id: "c", photo: FLOWER, title: "fort greene sunday", date: "2026-08-30", href: "#" },
];
const fit = {
  id: "f",
  title: "Live from Sugarhill Supper Club & Disco",
  caption: "Stephanie and I from the Sugarhill Supper Club & Disco in Bed-Stuy, Brooklyn.\n\nphoto by nez",
  date: "2026-09-26",
  location: "Bed-Stuy, Brooklyn",
  photos: [SUGAR],
  view_count: 42,
};
const worn = [
  { id: "1", brand: "Arc'teryx", type: "Jacket", name: "Two-Tone Arc'teryx Weather Shell", year: "2011", size: "L", photo: JACKET, href: "#" },
  { id: "2", brand: "Arc'teryx", type: "Bag", name: "Mantis 2 Waist Pack", year: "2019", size: "OS", photo: null, href: "#" },
  { id: "3", brand: "Carhartt", type: "Hat", name: "Acrylic Watch Hat", year: null, size: "OS", photo: null, is_private: true, href: "#" },
  { id: "4", brand: "Timberland", type: "T-Shirt", name: null, year: null, size: "L", photo: null, href: "#" },
  { id: "5", brand: "Dickies", type: "Pants", name: "Double Knee Cargo", year: null, size: "34", photo: null, href: "#" },
  { id: "6", brand: "Nike", type: "Shoes", name: "Court Low", year: null, size: "10.5", photo: FLOWER, href: "#" },
];
const reactors = [
  { username: "stephanie", avatar_url: null, emoji: "🔥", created_at: ago(2) },
  { username: "nez", avatar_url: null, emoji: "🔥", created_at: ago(5) },
  { username: "mara", avatar_url: null, emoji: "🤍", created_at: ago(9) },
  { username: "jules", avatar_url: null, emoji: "🔥", created_at: ago(20) },
  { username: "ade", avatar_url: null, emoji: "🪩", created_at: ago(30) },
];

export default function DetailsDemo({ searchParams }: { searchParams: { v?: string } }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const v = searchParams.v ?? "full";

  if (v === "sparse" || v === "full" || v === "private") {
    const piece =
      v === "sparse"
        ? { ...fullPiece, brand: "Timberland", type: "T-Shirt", name: null, year: null, season: null, size: null, condition: "Heavily Worn", made_in: null, story: null, photos: [] }
        : { ...fullPiece, season: v === "private" ? null : "FW" };
    return (
      <OwnerPieceView
        piece={{ ...piece, estimatedValue: v === "sparse" ? null : 180, is_private: v === "private" }}
        username="dillon"
        collections={[
          { id: "g", name: "gorpcore 🏔️" },
          { id: "d", name: "daily rotation" },
        ]}
        memberOf={v === "sparse" ? [] : ["g", "d"]}
        wornIn={v === "sparse" ? [] : wornIn}
        share={share}
      />
    );
  }

  if (v === "visitor") {
    return (
      <PieceDetail
        piece={{ ...fullPiece, year: null, season: null, photos: [JACKET, FLOWER] }}
        owner={false}
        byline="@dillon"
        wornIn={wornIn.slice(0, 2)}
        collections={[{ id: "g", name: "gorpcore 🏔️", href: "#" }]}
        chips={<VisitorChips glass />}
        toolbar={<VisitorChips glass={false} />}
      />
    );
  }

  if (v === "fitvisitor") {
    return (
      <FitDetail
        fit={fit}
        pieces={worn.filter((p) => !p.is_private)}
        owner={false}
        byline="@dillon"
        reactions={[
          { emoji: "🔥", count: 3, mine: true },
          { emoji: "🤍", count: 1, mine: false },
          { emoji: "🪩", count: 1, mine: false },
        ]}
        token="demo"
        signedIn
        chips={<VisitorChips glass />}
        toolbar={<VisitorChips glass={false} />}
      />
    );
  }

  const minimal = v === "fitmin";
  return (
    <OwnerFitView
      fit={{
        ...(minimal ? { ...fit, title: null, caption: null, location: null, view_count: 3 } : fit),
        worn: minimal ? [] : worn,
        reactions: minimal
          ? []
          : [
              { emoji: "🔥", count: 3, mine: false },
              { emoji: "🤍", count: 1, mine: false },
              { emoji: "🪩", count: 1, mine: false },
            ],
        reactors: minimal ? [] : reactors,
      }}
      username="dillon"
      share={share}
    />
  );
}
