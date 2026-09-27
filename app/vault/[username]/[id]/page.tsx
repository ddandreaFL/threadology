import { redirect } from "next/navigation";

/**
 * A piece's owner page moved to /pieces/<id>. This address was only ever the
 * owner's (RLS returns a piece to nobody else), so it forwards.
 */
export default function OldPieceAddress({ params }: { params: { id: string } }) {
  redirect(`/pieces/${params.id}`);
}
