import { redirect } from "next/navigation";

/** The editor's old address; it lives at /pieces/<id>/edit now. */
export default function OldEditRedirect({ params }: { params: { id: string } }) {
  redirect(`/pieces/${params.id}/edit`);
}
