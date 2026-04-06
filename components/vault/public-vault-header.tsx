import Link from "next/link";
import type { Database } from "@/types/database";
import { CopyLinkButton } from "./copy-link-button";
import { FREE_PIECE_LIMIT } from "@/lib/subscription";

type Profile = Database["public"]["Tables"]["users"]["Row"];
type Piece = Pick<
  Database["public"]["Tables"]["pieces"]["Row"],
  "brand" | "year" | "type" | "estimated_value"
>;

interface PublicVaultHeaderProps {
  profile: Profile;
  pieces: Piece[];
  isOwner: boolean;
  vaultUrl: string;
  showVisitorCta: boolean;
}

function formatJoinDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

function getEraSpan(pieces: Piece[]): string | null {
  const years = pieces.flatMap((p) => {
    if (!p.year) return [];
    const m = p.year.match(/\b(19|20)\d{2}\b/);
    return m ? [parseInt(m[0])] : [];
  });
  if (years.length < 2) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? null : `${min}–${max}`;
}

function getTopBrands(pieces: Piece[], limit = 5): string[] {
  const counts = new Map<string, number>();
  for (const p of pieces) {
    const b = p.brand.toLowerCase();
    counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([brand]) => brand);
}

export function PublicVaultHeader({
  profile,
  pieces,
  isOwner,
  vaultUrl,
  showVisitorCta,
}: PublicVaultHeaderProps) {
  const pieceCount = pieces.length;
  const brandCount = new Set(pieces.map((p) => p.brand.toLowerCase())).size;
  const eraSpan = getEraSpan(pieces);
  const topBrands = getTopBrands(pieces);
  const initial = profile.username[0].toUpperCase();
  const limitPct = Math.min(
    100,
    Math.round((pieceCount / FREE_PIECE_LIMIT) * 100)
  );
  const atLimit = pieceCount >= FREE_PIECE_LIMIT;

  return (
    <div className="space-y-4 border-b border-[#E0D8CC] pb-6">
      {/* ── Row 1: Identity ── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-10 w-10 shrink-0 rounded-full border border-[#E0D8CC] object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E0D8CC] bg-[#2D5A45]/10">
              <span className="font-serif text-base text-[#2D5A45]">
                {initial}
              </span>
            </div>
          )}

          {/* Username + meta */}
          <div>
            <p className="font-serif text-xl leading-tight text-gray-900">
              @{profile.username}
            </p>
            <p className="mt-0.5 font-mono-display text-[11px] text-gray-400">
              Joined {formatJoinDate(profile.created_at)}&nbsp;&middot;&nbsp;
              {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>

        {/* Owner icon buttons */}
        {isOwner && (
          <div className="flex items-center gap-0.5">
            <CopyLinkButton url={vaultUrl} iconOnly />
            <Link
              href="/settings"
              title="Edit profile"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#F5F1EA] hover:text-gray-700"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Bio (if set) */}
      {profile.bio && (
        <p className="text-sm text-gray-600">{profile.bio}</p>
      )}

      {/* ── Row 2: Stats Grid ── */}
      <div className="grid grid-cols-3 divide-x divide-[#E0D8CC] border-y border-[#E0D8CC]">
        {[
          { value: String(pieceCount), label: "Pieces" },
          { value: String(brandCount), label: "Brands" },
          { value: eraSpan ?? "—", label: "Era Span" },
        ].map(({ value, label }) => (
          <div key={label} className="py-3 text-center">
            <p className="text-2xl font-semibold tabular-nums text-gray-900">
              {value}
            </p>
            <p className="mt-0.5 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Row 3: Top Brands ── */}
      {topBrands.length >= 2 && (
        <div>
          <p className="mb-2 font-mono-display text-[10px] uppercase tracking-widest text-gray-400">
            Top Brands
          </p>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {topBrands.map((brand) => (
              <span
                key={brand}
                className="shrink-0 rounded-full border border-[#E0D8CC] px-3 py-1 font-mono-display text-[10px] uppercase tracking-widest text-[#2C2C2C]"
              >
                {brand}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 4: Piece Limit (owner + free tier) ── */}
      {isOwner && !profile.is_premium && (
        <div className="flex items-center gap-3">
          <span className="shrink-0 font-mono-display text-[11px] text-gray-400">
            {pieceCount} of {FREE_PIECE_LIMIT}
          </span>
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[#E0D8CC]">
            <div
              className={`h-full rounded-full transition-all ${
                atLimit ? "bg-amber-400" : "bg-[#2D5A45]"
              }`}
              style={{ width: `${limitPct}%` }}
            />
          </div>
          <Link
            href="/upgrade"
            className="shrink-0 font-mono-display text-[11px] font-medium text-[#2D5A45] transition-colors hover:text-[#1E3D2F]"
          >
            Upgrade →
          </Link>
        </div>
      )}

      {/* ── Row 5: Visitor CTA ── */}
      {showVisitorCta && (
        <Link
          href="/signup"
          className="flex items-center justify-center gap-1.5 rounded-xl border border-[#2D5A45]/25 bg-[#2D5A45]/5 py-2.5 text-sm font-medium text-[#2D5A45] transition-colors hover:bg-[#2D5A45]/10"
        >
          Create your own vault →
        </Link>
      )}
    </div>
  );
}
