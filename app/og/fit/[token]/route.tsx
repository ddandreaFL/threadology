import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * The unfurl card for a shared fit.
 *
 * Most people meet Threadology as a link preview in Discord or iMessage
 * before they ever see a page, so this is the first impression and not
 * polish. It is photo-led on purpose: the pieces carry the card, and the
 * owner's name is always on it, because attribution is the point.
 *
 * Data comes from shared_fit(), the same token-gated function the page
 * uses, so a revoked or private link produces the neutral card below rather
 * than leaking a name or a count. A password-protected collection is treated
 * the same way — the challenge must not be bypassable through the unfurl.
 */

const INK = "#1B1A17";
const BG = "#FDFCFA";
const MUTED = "#6B6358";
const ACCENT = "#2D5A45";

type SharedFit = {
  owner: { username: string; avatar_url: string | null };
  fit: { title: string | null; photos: string[] };
  pieces: { id: string; photos: string[] }[];
  password_required?: boolean;
};

async function fetchFit(token: string): Promise<SharedFit | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/rpc/shared_fit`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token }),
    // The card is cached at the edge; see the headers below.
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as SharedFit | null;
  if (!data || data.password_required) return null;
  return data;
}

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  const data = await fetchFit(params.token);

  // Unknown, revoked, private or password-gated: a card that says nothing.
  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BG,
            color: MUTED,
            fontSize: 34,
            letterSpacing: -0.5,
          }}
        >
          threadology
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // The fit's own photo leads; the pieces follow it.
  const photos = [data.fit.photos?.[0], ...data.pieces.map((p) => p.photos?.[0])]
    .filter(Boolean)
    .slice(0, 3) as string[];
  const count = data.pieces.length;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG }}>
        {/* Left: who and what. Generous space, set with some confidence — the
            page is judged like a lookbook, not a database. */}
        <div
          style={{
            width: photos.length > 0 ? 470 : 1200,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 56px",
          }}
        >
          <div
            style={{
              fontSize: 20,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: ACCENT,
              marginBottom: 20,
            }}
          >
            {`@${data.owner.username}`}
          </div>
          <div
            style={{
              fontSize: 62,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: INK,
              fontWeight: 700,
            }}
          >
            {data.fit.title ?? "a fit"}
          </div>
          <div style={{ fontSize: 26, color: MUTED, marginTop: 24 }}>
            {count > 0 ? `${count} ${count === 1 ? "piece" : "pieces"}` : "a fit"}
          </div>
        </div>

        {/* Right: the pieces. They are the reason anyone taps. */}
        {photos.length > 0 && (
          <div style={{ display: "flex", flex: 1, gap: 10, padding: "48px 48px 48px 0" }}>
            {photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                width={photos.length === 1 ? 640 : photos.length === 2 ? 320 : 210}
                height={534}
                style={{ objectFit: "cover", borderRadius: 14, flex: 1 }}
              />
            ))}
          </div>
        )}
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        // Cached so Discord and iMessage are not regenerating this on every
        // paste, but not immutable: the card changes when pieces are added.
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
