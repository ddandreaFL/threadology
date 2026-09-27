import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fitPieceOptions } from "@/lib/fit-pieces";
import { FitEditor } from "@/components/fit/FitEditor";

export const metadata = { title: "edit fit · threadology" };

export default async function EditFitPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const supabase = await createServerClient();
  const [{ data: fit }, pieces] = await Promise.all([
    supabase
      .from("fits")
      .select("id, title, caption, date, photos, fit_pieces(piece_id, layer_order)")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single(),
    fitPieceOptions(supabase, user.id),
  ]);
  if (!fit) notFound();
  const pieceIds = [...(fit.fit_pieces ?? [])].sort((a, b) => a.layer_order - b.layer_order).map((fp) => fp.piece_id);

  return (
    <FitEditor
      userId={user.id}
      pieces={pieces}
      fit={{ id: fit.id, title: fit.title, caption: fit.caption, date: fit.date ?? new Date().toISOString().slice(0, 10), photos: fit.photos ?? [], pieceIds }}
    />
  );
}
