import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EmptyVault } from "@/components/vault/empty-vault";
import { VaultClient } from "@/components/vault/vault-client";
import { UpgradeSuccessToast } from "@/components/vault/upgrade-success-toast";

interface Props {
  params: { username: string };
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
    .select("id, username, avatar_url")
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
    twitter: { card: "summary_large_image" },
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

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UpgradeSuccessToast />
      </Suspense>
      {pieces.length === 0 ? (
        isOwner ? (
          <EmptyVault />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-[#FDFCFA] py-24 text-center">
            <p className="text-lg text-gray-500">This vault is empty.</p>
          </div>
        )
      ) : (
        <VaultClient pieces={pieces} basePath={`/vault/${profile.username}`} />
      )}

      {isOwner && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4"
          style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        >
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
