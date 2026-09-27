import { notFound } from "next/navigation";
import { AddPieceFlow } from "@/components/piece/AddPieceFlow";
import { EditPieceForm } from "@/components/piece/EditPieceForm";
import { FitEditor } from "@/components/fit/FitEditor";

/**
 * The editors with stand-in data — for reviewing phase 4 without signing
 * in. Saving does nothing useful here. Preview and local builds only.
 * ?e=add | edit | fit
 */
export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const swatch = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><rect width="3" height="4" fill="hsl(${hue},35%,55%)"/></svg>`
  )}`;
const collections = [
  { id: "c1", name: "Timberland archive" },
  { id: "c2", name: "Summer rotation ☀️" },
];

export default function EditorsDemo({ searchParams }: { searchParams: { e?: string } }) {
  if (process.env.VERCEL_ENV === "production") notFound();
  const e = searchParams.e ?? "add";
  if (e === "edit")
    return (
      <EditPieceForm
        userId="demo"
        collections={collections}
        memberOf={["c1"]}
        piece={{
          id: "p1",
          brand: "Timberland",
          type: "Tops — T-Shirt",
          name: "Water Conservation Tee",
          year: "1994",
          season: "spring/summer",
          size: "L",
          condition: "excellent",
          made_in: "USA",
          story: "Found at a thrift in Asheville.",
          photos: [swatch(20), swatch(200)],
          is_private: false,
          estimatedValue: 80,
        }}
      />
    );
  if (e === "fit")
    return (
      <FitEditor
        userId="demo"
        pieces={[0, 1, 2, 3, 4].map((i) => ({ id: `p${i}`, brand: "Timberland", type: "Tops — T-Shirt", name: `Piece ${i + 1}`, photo: swatch(i * 60) }))}
        fit={{ id: "f1", title: "quiet morning", caption: null, date: "2026-09-20", photos: [swatch(120)], pieceIds: ["p1", "p3"] }}
      />
    );
  return <AddPieceFlow userId="demo" topBrands={["Timberland", "Patagonia", "Engineered Garments"]} collections={collections} />;
}
