import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EmptyVault } from "@/components/vault/empty-vault";
import { VaultClient } from "@/components/vault/vault-client";
import { PublicVaultHeader } from "@/components/vault/public-vault-header";
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
    .select("id, username, avatar_url, bio, created_at, is_premium")
    .eq("username", username)
    .single();

  if (!profile) return null;

  const [piecesResult, collectionsResult, membershipsResult] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, photos, crop_positions, estimated_value, created_at, updated_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    supabase.from("collections").select("id, name, slug").eq("user_id", profile.id).order("position"),
    supabase.from("pieces").select("id, collection_pieces(collection_id)").eq("user_id", profile.id),
  ]);

  const membershipMap: Record<string, string[]> = {};
  for (const p of (membershipsResult.data ?? [])) {
    membershipMap[p.id] = (p.collection_pieces ?? []).map((cp) => cp.collection_id);
  }

  const pieces = (piecesResult.data ?? []).map((p) => ({
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
  const isGuest = !viewer;

  const vaultUrl = `https://threadology.co/vault/${profile.username}`;

  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <UpgradeSuccessToast />
      </Suspense>

      <PublicVaultHeader
        profile={profile}
        pieces={pieces}
        isOwner={isOwner}
        vaultUrl={vaultUrl}
      />

      {pieces.length === 0 ? (
        isOwner ? (
          <EmptyVault />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBEBEB] py-24 text-center">
            <p className="text-[13px] text-[#999999]">this vault is empty</p>
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

      {isGuest && <GuestCTA username={profile.username} pieceCount={pieces.length} />}
    </div>
  );
}

function GuestCTA({ username }: { username: string; pieceCount: number }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Fade gradient */}
      <div className="h-16 bg-gradient-to-t from-white to-transparent" />

      <div className="bg-white px-4 pb-8 pt-2">
        <div
          className="mx-auto flex max-w-sm flex-col items-center gap-3 rounded-[24px] bg-[#1A1A1A] px-6 py-5"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.18)" }}
        >
          <p className="text-center text-[13px] text-white/60">
            @{username} documents their wardrobe on threadology
          </p>
          <a
            href="/signup"
            className="w-full rounded-[30px] bg-white py-3 text-center text-[15px] font-medium text-[#1A1A1A] transition-opacity hover:opacity-80"
          >
            start your vault →
          </a>
          <a href="/login" className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
            log in
          </a>
        </div>
      </div>
    </div>
  );
}
