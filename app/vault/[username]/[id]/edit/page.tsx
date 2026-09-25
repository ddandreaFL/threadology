import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { EditPieceForm } from "@/components/vault/edit-piece-form";
import { OwnerPageShell } from "@/components/layout/owner-page-shell";

interface Props {
  params: { username: string; id: string };
}

export default async function EditPiecePage({ params }: Props) {
  const user = await requireUser();
  const supabase = await createServerClient();

  // Owner-only: verify the username matches the logged-in user
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("username", params.username)
    .single();

  if (!profile || profile.id !== user.id) notFound();

  const { data: piece } = await supabase
    .from("pieces")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!piece) notFound();

  const { data: piecePrivate } = await supabase
    .from("piece_private")
    .select("estimated_value")
    .eq("piece_id", params.id)
    .maybeSingle();
  const estimatedValue = piecePrivate?.estimated_value ?? null;

  const displayName = piece.name ?? piece.type;
  const backHref = `/vault/${params.username}/${params.id}`;

  return (
    <OwnerPageShell>
      <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <Link
          href={backHref}
          className="text-[14px] text-[#999999] transition-colors hover:text-[#111111]"
        >
          ← back
        </Link>
      </div>

      <div className="mb-8">
        <p className="text-[11px] text-[#999999]">{piece.brand.toLowerCase()}</p>
        <h1 className="mt-1 text-[22px] font-medium tracking-[-0.02em] text-[#111111]">
          {displayName.toLowerCase()}
        </h1>
      </div>

      <EditPieceForm piece={piece} estimatedValue={estimatedValue} userId={user.id} backHref={backHref} />
    </div>
    </OwnerPageShell>
  );
}
