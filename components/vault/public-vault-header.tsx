import Link from "next/link";
import type { Database } from "@/types/database";
import { CollectionStats } from "./collection-stats";
import { CopyLinkButton } from "./copy-link-button";

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
}

export function PublicVaultHeader({
  profile,
  pieces,
  isOwner,
  vaultUrl,
}: PublicVaultHeaderProps) {
  return (
    <div className="border-b border-[#E0D8CC] pb-10">
      {/* Username */}
      <h1 className="font-serif text-3xl text-gray-900">@{profile.username}</h1>

      {/* Bio */}
      {profile.bio && (
        <p className="mt-2 max-w-lg text-base text-gray-600">{profile.bio}</p>
      )}

      {/* Stats */}
      {pieces.length > 0 && (
        <div className="mt-4">
          <CollectionStats pieces={pieces} />
        </div>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E0D8CC] bg-[#FDFCFA] px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-[#F5F1EA]"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit profile
          </Link>
          <CopyLinkButton url={vaultUrl} />
        </div>
      )}
    </div>
  );
}
