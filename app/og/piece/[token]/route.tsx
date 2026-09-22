import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * The unfurl card for a single shared piece.
 *
 * Photo-led like the others, and for the same reason: a link pasted into a
 * message is the first thing anyone sees of Threadology. Data comes from
 * shared_piece(), the same token-gated function the page uses, so a revoked,
 * private or password-gated link produces the neutral card instead of
 * leaking a name.
 */

const INK = "#1B1A17";
const BG = "#FDFCFA";
const MUTED = "#6B6358";
const ACCENT = "#2D5A45";

type SharedPiece = {
  owner: { username: string };
  piece: {
    brand: string;
    type: string;
    name: string | null;
    year: string | null;
    size: string | null;
    photos: string[];
  };
  password_required?: boolean;
};

async function fetchPiece(token: string): Promise<SharedPiece | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  const res = await fetch(`${url}/rest/v1/rpc/shared_piece`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token }),
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as SharedPiece | null;
  if (!data || data.password_required) return null;
  return data;
}

export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const data = await fetchPiece(params.token);

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

  const photos = (data.piece.photos ?? []).filter(Boolean).slice(0, 2);
  const line = [data.piece.year, data.piece.size ? `size ${data.piece.size}` : null]
    .filter(Boolean)
    .join(" · ");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BG }}>
        <div
          style={{
            width: photos.length > 0 ? 500 : 1200,
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
            {data.piece.brand}
          </div>
          <div
            style={{
              fontSize: 60,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: INK,
              fontWeight: 700,
            }}
          >
            {data.piece.name ?? data.piece.type}
          </div>
          <div style={{ fontSize: 26, color: MUTED, marginTop: 24 }}>
            {line || data.piece.type}
          </div>
          <div style={{ fontSize: 22, color: MUTED, marginTop: 14 }}>
            {`from @${data.owner.username}'s archive`}
          </div>
        </div>

        {photos.length > 0 && (
          <div style={{ display: "flex", flex: 1, gap: 10, padding: "48px 48px 48px 0" }}>
            {photos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                width={photos.length === 1 ? 600 : 300}
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
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
