import Link from "next/link";
import { CopyLinkButton } from "./copy-link-button";

type Profile = {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  is_premium: boolean | null;
};

type Piece = {
  brand: string;
  year: string | null;
};

interface PublicVaultHeaderProps {
  profile: Profile;
  pieces: Piece[];
  isOwner: boolean;
  /**
   * The vault's live share link (with its ?k= token), or null when the
   * vault is not shared. A bare /vault/<username> URL is a dead link since
   * sharing moved to tokens, so there is nothing to copy without one.
   */
  vaultUrl: string | null;
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

function getEraSpan(pieces: Piece[]): string | null {
  const years = pieces.flatMap((p) => {
    const m = p.year?.match(/\b(19|20)\d{2}\b/);
    return m ? [parseInt(m[0])] : [];
  });
  if (years.length < 2) return null;
  const min = Math.min(...years);
  const max = Math.max(...years);
  return min === max ? null : `${min}–${max}`;
}

export function PublicVaultHeader({ profile, pieces, isOwner, vaultUrl }: PublicVaultHeaderProps) {
  const pieceCount = pieces.length;
  const brandCount = new Set(pieces.map((p) => p.brand.toLowerCase())).size;
  const eraSpan = getEraSpan(pieces);
  const topBrands = getTopBrands(pieces);
  const initial = profile.username[0].toUpperCase();
  const joinYear = new Date(profile.created_at).getFullYear();

  return (
    <div className="mb-6 space-y-5">
      {/* Identity row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatar_url}
              alt={profile.username}
              className="h-14 w-14 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1A1A1A]">
              <span className="text-[20px] font-medium text-white">{initial}</span>
            </div>
          )}
          <div>
            <p className="text-[18px] font-medium tracking-[-0.02em] text-[#111111]">
              @{profile.username}
            </p>
            <p className="mt-0.5 text-[12px] text-[#999999]">
              collecting since {joinYear}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-1 pt-1">
            {vaultUrl && <CopyLinkButton url={vaultUrl} iconOnly />}
            <Link
              href="/settings"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#999999] transition-colors hover:bg-[#F5F5F5] hover:text-[#111111]"
              title="Edit profile"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <p className="text-[13px] leading-relaxed text-[#555555]">{profile.bio}</p>
      )}

      {/* Stats */}
      <div className="flex divide-x divide-[#EBEBEB] border-y border-[#EBEBEB]">
        {[
          { value: pieceCount, label: "pieces" },
          { value: brandCount, label: "brands" },
          { value: eraSpan ?? "—", label: "era" },
        ].map(({ value, label }) => (
          <div key={label} className="flex-1 py-3 text-center">
            <p className="text-[18px] font-semibold text-[#111111]">{value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-[#999999]">{label}</p>
          </div>
        ))}
      </div>

      {/* Top brands */}
      {topBrands.length >= 2 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {topBrands.map((brand) => (
            <span
              key={brand}
              className="shrink-0 rounded-full border border-[#EBEBEB] px-3 py-1 text-[11px] text-[#555555]"
            >
              {brand}
            </span>
          ))}
        </div>
      )}

    </div>
  );
}
