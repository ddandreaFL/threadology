import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
  collectionIds: string[];
};

async function getVaultData(username: string) {
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .eq("username", username)
    .single();

  if (!profile) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const [piecesResult, collectionsResult, membershipsResult] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, photos, crop_positions, estimated_value, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    db.from("collections").select("id, name, slug").eq("user_id", profile.id).order("position"),
    db.from("pieces").select("id, collection_pieces(collection_id)").eq("user_id", profile.id),
  ]);

  const membershipMap: Record<string, string[]> = {};
  for (const p of (membershipsResult.data ?? [])) {
    membershipMap[p.id] = (p.collection_pieces ?? []).map((cp: { collection_id: string }) => cp.collection_id);
  }

  const pieces = (piecesResult.data ?? []).map((p: Omit<Piece, "collectionIds">) => ({
    ...p,
    collectionIds: membershipMap[p.id] ?? [],
  })) as Piece[];

  return {
    profile,
    pieces,
    collections: (collectionsResult.data ?? []) as { id: string; name: string; slug: string }[],
  };
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

  const { profile, pieces, collections } = data;
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
        <VaultClient
          pieces={pieces}
          collections={collections}
          basePath={`/vault/${profile.username}`}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}
