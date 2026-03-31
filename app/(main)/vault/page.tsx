import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export default async function VaultPage() {
  const user = await requireUser();
  const supabase = await createServerClient();

  const { data: pieces } = await supabase
    .from("pieces")
    .select("id, brand, type, name, photos")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">My Vault</h1>
        <Link
          href="/vault/new"
          className="rounded-lg bg-[#2D5A45] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E3D2F]"
        >
          + Add piece
        </Link>
      </div>

      {!pieces || pieces.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#C8BFB0] bg-white py-20 text-center">
          <p className="text-gray-500">Your vault is empty.</p>
          <Link
            href="/vault/new"
            className="mt-3 text-sm font-medium text-[#2D5A45] hover:underline"
          >
            Add your first piece →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {pieces.map((piece) => (
            <div
              key={piece.id}
              className="overflow-hidden rounded-xl border border-[#E0D8CC] bg-white"
            >
              <div className="aspect-square bg-[#F5F1EA]">
                {piece.photos[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={piece.photos[0]}
                    alt={piece.name ?? piece.brand}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                    ◻
                  </div>
                )}
              </div>
              <div className="px-3 py-2.5">
                <p className="truncate text-sm font-medium text-gray-900">
                  {piece.brand}
                </p>
                <p className="truncate text-xs text-gray-500 capitalize">
                  {piece.name ?? piece.type}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
