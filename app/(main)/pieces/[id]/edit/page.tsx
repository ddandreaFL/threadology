import { redirect } from "next/navigation";
import { requireUser, getUserProfile } from "@/lib/auth";

/**
 * The editor keeps its old address until phase 4 rebuilds it here; this
 * route exists so everything new can link to /pieces/<id>/edit already.
 */
export default async function EditPieceRedirect({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const profile = await getUserProfile(user.id);
  redirect(`/vault/${profile?.username ?? user.id}/${params.id}/edit`);
}
