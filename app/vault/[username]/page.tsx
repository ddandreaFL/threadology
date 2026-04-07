import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { VaultGrid } from "@/components/vault/vault-grid";
import { VaultFilters } from "@/components/vault/vault-filters";
import { EmptyVault } from "@/components/vault/empty-vault";
import { PublicVaultHeader } from "@/components/vault/public-vault-header";

interface Props {
  params: { username: string };
  searchParams?: { sort?: string; type?: string; brand?: string };
}

type Piece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  photos: string[];
  crop_positions: Record<string, { x: number; y: number }> | null;
  estimated_value: number | null;
  created_at: string;
  updated_at: string;
};

async function getVaultData(username: string) {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const { data: pieces } = await supabase
    .from("pieces")
    .select(
      "id, brand, type, name, year, photos, crop_positions, estimated_value, created_at, updated_at"
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return { profile, pieces: (pieces ?? []) as Piece[] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getVaultData(params.username);
  if (!data) return { title: "Vault not found | Threadology" };

  const { profile, pieces } = data;
  const pieceCount = pieces.length;
  const brandCount = new Set(pieces.map((p) => p.brand.toLowerCase())).size;

  return {
    title: `@${profile.username}'s Vault | Threadology`,
    description: `${pieceCount} pieces documented. Browse the collection.`,
    openGraph: {
      title: `@${profile.username}'s Vault`,
      description: `${pieceCount} pieces across ${brandCount} brands.`,
      images: [profile.avatar_url ?? "/og-default.png"],
      url: `https://threadology.vercel.app/vault/${profile.username}`,
    },
    twitter: {
      card: "summary_large_image",
    },
  };
}

function applyFiltersAndSort(
  pieces: Piece[],
  sort: string,
  typeFilter: string | undefined,
  brandFilter: string | undefined
): Piece[] {
  let result = [...pieces];

  if (typeFilter) {
    result = result.filter((p) => p.type === typeFilter);
  }
  if (brandFilter) {
    result = result.filter(
      (p) => p.brand.toLowerCase() === brandFilter.toLowerCase()
    );
  }

  switch (sort) {
    case "updated":
      result.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      break;
    case "brand":
      result.sort((a, b) => a.brand.localeCompare(b.brand));
      break;
    case "year_asc":
      result.sort((a, b) => {
        const ya = parseInt(a.year ?? "0") || 0;
        const yb = parseInt(b.year ?? "0") || 0;
        if (ya === 0) return 1;
        if (yb === 0) return -1;
        return ya - yb;
      });
      break;
    case "year_desc":
      result.sort((a, b) => {
        const ya = parseInt(a.year ?? "0") || 0;
        const yb = parseInt(b.year ?? "0") || 0;
        if (ya === 0) return 1;
        if (yb === 0) return -1;
        return yb - ya;
      });
      break;
    default:
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  }

  return result;
}

export default async function PublicVaultPage({ params, searchParams }: Props) {
  const [data, viewer] = await Promise.all([
    getVaultData(params.username),
    getUser(),
  ]);

  if (!data) notFound();

  const { profile, pieces: allPieces } = data;
  const isOwner = viewer?.id === profile.id;
  const vaultUrl = `https://threadology.vercel.app/vault/${profile.username}`;

  const sort = searchParams?.sort ?? "added";
  const typeFilter = searchParams?.type;
  const brandFilter = searchParams?.brand;

  const pieces = applyFiltersAndSort(allPieces, sort, typeFilter, brandFilter);

  const uniqueBrands = Array.from(
    new Set(allPieces.map((p) => p.brand.toLowerCase()))
  ).sort();
  const uniqueTypes = Array.from(new Set(allPieces.map((p) => p.type))).sort();

  const isFiltered = !!typeFilter || !!brandFilter;

  return (
    <div className="pb-24">
      <PublicVaultHeader
        profile={profile}
        pieces={allPieces}
        isOwner={isOwner}
        vaultUrl={vaultUrl}
        showVisitorCta={!viewer}
      />

      <div className="mt-8">
        {allPieces.length === 0 ? (
          isOwner ? (
            <EmptyVault />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-24 text-center">
              <p className="text-lg text-gray-500">This vault is empty.</p>
            </div>
          )
        ) : (
          <>
            {/* Filter bar — only show when vault has pieces */}
            <div className="mb-6">
              <Suspense fallback={null}>
                <VaultFilters brands={uniqueBrands} types={uniqueTypes} />
              </Suspense>
            </div>

            {pieces.length === 0 && isFiltered ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-16 text-center">
                <p className="text-sm text-gray-400">
                  No pieces match this filter.
                </p>
              </div>
            ) : (
              <VaultGrid
                pieces={pieces}
                basePath={`/vault/${profile.username}`}
              />
            )}
          </>
        )}
      </div>

      {/* Owner: floating Add button */}
      {isOwner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
          <Link
            href="/vault/add"
            className="flex items-center gap-2 rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#1E3D2F] hover:shadow-xl active:scale-95"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add piece
          </Link>
        </div>
      )}
    </div>
  );
}
