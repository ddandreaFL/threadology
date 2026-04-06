import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { VaultGrid } from "@/components/vault/vault-grid";
import { EmptyVault } from "@/components/vault/empty-vault";
import { PublicVaultHeader } from "@/components/vault/public-vault-header";
import { PieceLimitBanner } from "@/components/vault/piece-limit-banner";
import { FREE_PIECE_LIMIT } from "@/lib/subscription";

interface Props {
  params: { username: string };
}

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
    .select("id, brand, type, name, year, photos, crop_positions, estimated_value")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return { profile, pieces: pieces ?? [] };
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

export default async function PublicVaultPage({ params }: Props) {
  const [data, viewer] = await Promise.all([
    getVaultData(params.username),
    getUser(),
  ]);

  if (!data) notFound();

  const { profile, pieces } = data;
  const isOwner = viewer?.id === profile.id;
  const vaultUrl = `https://threadology.vercel.app/vault/${profile.username}`;

  // Free tier: show usage banner to owner
  const showLimitBanner = isOwner && !profile.is_premium;

  return (
    <div className="pb-24">
      <PublicVaultHeader
        profile={profile}
        pieces={pieces}
        isOwner={isOwner}
        vaultUrl={vaultUrl}
      />

      {showLimitBanner && (
        <div className="mt-6">
          <PieceLimitBanner count={pieces.length} limit={FREE_PIECE_LIMIT} />
        </div>
      )}

      <div className="mt-10">
        {pieces.length === 0 ? (
          isOwner ? (
            <EmptyVault />
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-24 text-center">
              <p className="text-lg text-gray-500">This vault is empty.</p>
            </div>
          )
        ) : (
          <VaultGrid
            pieces={pieces}
            basePath={`/vault/${profile.username}`}
          />
        )}
      </div>

      {/* Non-owner footer CTA */}
      {!viewer && (
        <div className="mt-20 border-t border-[#E0D8CC] pt-10 text-center">
          <p className="font-mono-display text-xs uppercase tracking-widest text-gray-400">
            Documented with Threadology
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#2D5A45] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
          >
            Create your own vault →
          </Link>
        </div>
      )}

      {/* Owner: floating Add button */}
      {isOwner && (
        <div className="fixed bottom-6 left-0 right-0 z-40 flex justify-center px-4">
          <Link
            href="/vault/add"
            className="flex items-center gap-2 rounded-full bg-[#2D5A45] px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-[#1E3D2F] hover:shadow-xl active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add piece
          </Link>
        </div>
      )}
    </div>
  );
}
