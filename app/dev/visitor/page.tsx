import { notFound } from "next/navigation";
import { VisitorFrame } from "@/components/visitor/VisitorFrame";
import { SharedVault } from "@/components/visitor/SharedVault";

/**
 * The visitor view of a shared vault, with stand-in data — for reviewing
 * phase 2 without a live link. Preview and local builds only.
 */
export const metadata = { robots: { index: false, follow: false } };
// Rendered per request, like the real pages: it checks the environment,
// and the save button reads the URL.
export const dynamic = "force-dynamic";

const swatch = (hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 4"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},35%,62%)"/><stop offset="1" stop-color="hsl(${hue + 20},40%,38%)"/></linearGradient></defs><rect width="3" height="4" fill="url(#g)"/></svg>`
  )}`;
const NAMES = ["Water Conservation Tee", "Adventure Tee", "Road Less Traveled Tee", "Collegiate Heritage Polo", "Retro Leaf Shirt", "Tan Weathergear Jacket"];

export default function VisitorDemo() {
  if (process.env.VERCEL_ENV === "production") notFound();
  const pieces = NAMES.map((name, i) => ({
    id: String(i),
    brand: "Timberland",
    type: i === 5 ? "Outerwear — Jacket" : "Tops — T-Shirt",
    name,
    year: i % 2 ? "1994" : null,
    season: i % 3 === 0 ? "spring/summer" : null,
    size: "L",
    condition: "excellent",
    made_in: i % 2 ? "USA" : null,
    story: i === 0 ? "One of my favorite TBL slogan tees. The crooked front wordmark with the shifty back hit makes for a unique piece." : null,
    photos: [swatch(20 + i * 40), swatch(200 + i * 20)],
    materials: null,
    acquired_where: i === 0 ? "a flea market in Brooklyn" : null,
    acquired_at: null,
  }));
  return (
    <VisitorFrame signedIn={false}>
      <SharedVault
        username="dillon"
        token="demo"
        pieces={pieces}
        collections={[
          { id: "c1", name: "tbl tees 🌳👕", slug: "tbl-tees", share_token: "demo", piece_count: 3, previews: [swatch(20), swatch(60), swatch(100)] },
          { id: "c2", name: "button downs", slug: "button-downs", share_token: "demo", piece_count: 1, previews: [swatch(180)] },
        ]}
        fits={[{ id: "f1", slug: "test", title: "Test", date: "2026-09-20", photos: [swatch(120)], share_token: "demo" }]}
        signedIn={false}
      />
    </VisitorFrame>
  );
}
