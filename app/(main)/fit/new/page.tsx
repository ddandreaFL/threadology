import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";
import { fitPieceOptions } from "@/lib/fit-pieces";
import { FitEditor } from "@/components/fit/FitEditor";

export const metadata = { title: "log a fit · threadology" };

export default async function NewFitPage() {
  const user = await requireUser();
  const supabase = await createServerClient();
  return <FitEditor userId={user.id} pieces={await fitPieceOptions(supabase, user.id)} />;
}
