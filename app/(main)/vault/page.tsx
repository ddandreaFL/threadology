import { requireUser, getUserProfile } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EmptyVault } from "@/components/vault/empty-vault";
import { VaultClient } from "@/components/vault/vault-client";
import { PublicVaultHeader } from "@/components/vault/public-vault-header";
import { getShareState } from "@/lib/share-state";
import { ShareControl } from "@/components/sharing/share-control";

/**
 * Your vault, signed in.
 *
 * This used to redirect to /vault/<username>, which was the owner's page
 * until the September sharing work made that route the *shared* vault — a
 * page that needs a ?k= token and says "This link is no longer active"
 * without one. Every sign-in landed there. The owner's vault lives here
 * now, built from the owner components that route used to render, reading
 * your own rows directly (RLS scopes them to you).
 */

const WEB_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://")
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://threadology.vercel.app";

type Piece = {
  id: string;
  brand: string;
  type: string;
  name: string | null;
  year: string | null;
  photos: string[];
  crop_positions: Record<string, { x: number; y: number }> | null;
  created_at: string;
  updated_at: string;
  collectionIds: string[];
};

export default async function OwnerVaultPage() {
  const user = await requireUser();
  const [profile, supabase] = await Promise.all([getUserProfile(user.id), createServerClient()]);
  if (!profile) return null;

  const [piecesResult, collectionsResult, shareResult] = await Promise.all([
    supabase
      .from("pieces")
      .select("id, brand, type, name, year, photos, crop_positions, created_at, updated_at, collection_pieces(collection_id)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("collections").select("id, name, slug").eq("user_id", user.id).order("position"),
    supabase.rpc("my_vault_share"),
  ]);

  const pieces: Piece[] = (piecesResult.data ?? []).map((p) => ({
    id: p.id,
    brand: p.brand,
    type: p.type,
    name: p.name,
    year: p.year,
    photos: p.photos ?? [],
    crop_positions: p.crop_positions as Piece["crop_positions"],
    created_at: p.created_at,
    updated_at: p.updated_at,
    collectionIds: ((p.collection_pieces ?? []) as { collection_id: string }[]).map((cp) => cp.collection_id),
  }));

  // The copy-link button copies the vault's real share link, and only when
  // the vault is shared.
  const share = (shareResult.data ?? null) as { visibility?: string; token?: string | null } | null;
  const vaultShare = await getShareState(supabase, "vault", user.id);
  const vaultUrl =
    share?.visibility === "link_only" && share.token ? `${WEB_ORIGIN}/vault/${profile.username}?k=${share.token}` : null;

  return (
    <div className="pb-24">
      <PublicVaultHeader profile={profile} pieces={pieces} isOwner vaultUrl={vaultUrl} />

      <div className="mx-auto mb-8 max-w-2xl">
        <ShareControl type="vault" id={user.id} username={profile.username} initial={vaultShare} />
      </div>

      {pieces.length === 0 ? (
        <EmptyVault />
      ) : (
        <VaultClient
          pieces={pieces}
          collections={(collectionsResult.data ?? []) as { id: string; name: string; slug: string }[]}
          basePath={`/vault/${profile.username}`}
          isOwner
        />
      )}
    </div>
  );
}
